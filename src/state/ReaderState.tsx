import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { deleteOwnAccount } from '../services/delete-account';
import { accountClient } from '../services/account';
import { readRemoteRecord, writeRemoteRecord } from '../services/reader-sync';
import { planReaderSync, type SyncSnapshot, type SyncPlan } from '../domain/reader-sync-plan';
import { bible } from '../data/bible';
import { restoreReaderRecord, preferredFontLevel } from '../domain/reader-preferences';
import type { FontLevel, ReaderRecord } from '../domain/reader-preferences';

const fontPreferenceKey = '@malsseum-feed/font-level/v1';
const storageKey = '@malsseum-feed/reader/v1';
type ReaderState = ReaderRecord & {
  ready: boolean;
  userId: string | null;
  syncBusy: boolean;
  syncMessage: string;
  syncChoice: Exclude<SyncPlan, { kind: 'write' }> | null;
  syncRecords: (choice?: 'local' | 'remote') => Promise<void>;
  importGuest: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  storageError: boolean;
  setPosition: (id: string) => void;
  toggleBookmark: (id: string) => void;
  toggleLike: (id: string) => void;
  setFontLevel: (level: FontLevel) => void;
  addComment: (verseId: string, text: string) => void;
  deleteComment: (id: string) => void;
};
const initial: ReaderRecord = { position: bible.verses[0].id, bookmarks: [], likes: [], fontLevel: 3, comments: [] };
const Context = createContext<ReaderState | null>(null);

export function ReaderProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ReaderRecord>(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writable = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const owner = useRef<string | null>(null);
  const epoch = useRef(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const busyRef = useRef(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncChoice, setSyncChoice] = useState<Exclude<SyncPlan, { kind: 'write' }> | null>(null);
  const [base, setBase] = useState<SyncSnapshot | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const keyFor = (id: string | null) => id ? `${storageKey}/account/${id}` : storageKey;
  const normalize = (record: unknown) => restoreReaderRecord(record, initial.position, id => Boolean(bible.find(id))); 
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    let started = false;
    async function selectAccount(id: string | null) {
      if (!active || (started && owner.current === id)) return;
      started = true;
      const generation = ++epoch.current;
      writable.current = false;
      owner.current = id;
      setUserId(id); setReady(false); setState(initial); setBase(null); setSyncChoice(null); setSyncMessage('');
      setSyncBusy(false); busyRef.current = false; setStorageError(false);
      try {
        await writeQueue.current;
        const [value, savedFont] = await Promise.all([AsyncStorage.getItem(keyFor(id)), AsyncStorage.getItem(fontPreferenceKey)]);
        if (!active || epoch.current !== generation) return;
        const parsed: unknown = value ? JSON.parse(value) : null;
        const applyFont = (record: ReaderRecord): ReaderRecord => {
          const fontLevel = preferredFontLevel(savedFont, record.fontLevel);
          // 새 기기 설정이 없으면 현재 계정의 마지막 크기를 초기값으로 이어갑니다.
          if (savedFont === null) writeQueue.current = writeQueue.current
            .then(() => AsyncStorage.setItem(fontPreferenceKey, String(fontLevel)))
            .catch(() => setStorageError(true));
          return { ...record, fontLevel };
        };
        if (id && parsed && (typeof parsed !== 'object' || !('record' in parsed))) throw new Error('계정 기록 형식 오류');
        if (id && parsed && typeof parsed === 'object' && 'record' in parsed) {
          const envelope = parsed as { record: unknown; base?: SyncSnapshot };
          const record = normalize(envelope.record);
          setState(applyFont(record));
          const candidate = envelope.base;
          setBase(candidate && Number.isSafeInteger(candidate.revision) && candidate.revision > 0
            ? { revision: candidate.revision, record: normalize(candidate.record) } : null);
        } else {
          const record = parsed && !id ? normalize(parsed) : initial;
          setState(applyFont(record)); setBase(null);
        }
        writable.current = true;
      } catch { if (active && epoch.current === generation) { setState(initial); setBase(null); setStorageError(true); } }
      finally { if (active && epoch.current === generation) setReady(true); }
    }
    const client = accountClient();
    if (!client) { void selectAccount(null); return () => { active = false; }; }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => { void selectAccount(session?.user.id ?? null); });
    client.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (!started) void selectAccount(data.session?.user.id ?? null);
    }).catch(() => { if (active) { setStorageError(true); setReady(true); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!ready || !writable.current) return;
    const key = keyFor(userId);
    const value = JSON.stringify(userId ? { record: state, base } : state);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(key, value))
      .catch(() => setStorageError(true));
  }, [state, ready, userId, base]);

  async function syncRecords(choice?: 'local' | 'remote') {
    const client = accountClient(), id = owner.current;
    if (!client || !id || !ready || !writable.current || busyRef.current) return;
    const generation = epoch.current;
    busyRef.current = true; setSyncBusy(true); setSyncMessage('동기화 중…');
    const valid = () => generation === epoch.current && owner.current === id;
    try {
      const raw = await readRemoteRecord(client);
      if (!valid()) return;
      const remote = raw ? { revision: raw.revision, record: normalize(raw.record) } : null;
      const plan = planReaderSync(stateRef.current, base, remote);
      if (plan.kind !== 'write' && !choice) { setSyncChoice(plan); setSyncMessage('사용할 기록을 선택해 주세요.'); return; }
      if (choice && (!syncChoice || !remote || remote.revision !== syncChoice.remote.revision)) {
        setSyncChoice(null); throw new Error('다른 기기에서 변경되었습니다.');
      }
      if (choice) await AsyncStorage.setItem(`${keyFor(id)}/backup/${Date.now()}`, JSON.stringify(stateRef.current));
      if (!valid()) return;
      if (choice === 'remote' && remote) {
        setState(remote.record); setBase(remote); setSyncChoice(null); setSyncMessage('계정 기록을 불러왔습니다.'); return;
      }
      const record = choice === 'local' ? stateRef.current : plan.kind === 'write' ? plan.record : null;
      if (!record) return;
      const revision = await writeRemoteRecord(client, record, remote?.revision ?? 0, id);
      if (!valid()) return;
      setState(record); setBase({ record, revision }); setSyncChoice(null); setSyncMessage('기록을 동기화했습니다.');
    } catch { if (valid()) setSyncMessage('동기화하지 못했습니다. 네트워크와 계정 상태를 확인하고 다시 시도해 주세요.'); }
    finally { if (valid()) { busyRef.current = false; setSyncBusy(false); } }
  }
  async function importGuest() {
    const id = owner.current;
    if (!id || !ready || !writable.current || busyRef.current) return;
    const generation = epoch.current;
    busyRef.current = true; setSyncBusy(true);
    try {
      const value = await AsyncStorage.getItem(storageKey);
      if (generation !== epoch.current) return;
      if (value) {
        const record = normalize(JSON.parse(value));
        await AsyncStorage.setItem(`${keyFor(id)}/backup/${Date.now()}`, JSON.stringify(stateRef.current));
        if (generation !== epoch.current) return;
        setState(record); setSyncChoice(null);
        setSyncMessage('비로그인 기록을 이 계정의 기기 기록으로 복사했습니다. 서버 저장은 동기화를 눌러 주세요.');
      } else setSyncMessage('가져올 비로그인 기록이 없습니다.');
    } finally { if (generation === epoch.current) { busyRef.current = false; setSyncBusy(false); } }
  }
  async function deleteAccount() {
    const client = accountClient(), id = owner.current;
    if (!client || !id || busyRef.current) throw new Error('현재 계정 확인 필요');
    const generation = epoch.current;
    busyRef.current = true; setSyncBusy(true);
    try {
      await writeQueue.current;
      await deleteOwnAccount(client, id);
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter(key => key === keyFor(id) || key.startsWith(`${keyFor(id)}/`))); 
      if (epoch.current === generation && owner.current === id) {
        writable.current = false;
        const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
        if (signOutError) throw signOutError;
      }
    } finally { if (epoch.current === generation) { busyRef.current = false; setSyncBusy(false); } }
  }

  const setPosition = useCallback((id: string) => {
    if (!writable.current || busyRef.current) return;
    if (!bible.find(id)) return;
    setState(current => current.position === id ? current : { ...current, position: id });
  }, []);
  const toggleBookmark = useCallback((id: string) => {
    if (!writable.current || busyRef.current) return;
    if (!bible.find(id)) return;
    setState(current => ({ ...current, bookmarks: current.bookmarks.includes(id)
      ? current.bookmarks.filter(saved => saved !== id) : [...current.bookmarks, id] }));
  }, []);

  const toggleLike = useCallback((id: string) => {
    if (!writable.current || busyRef.current) return;
    if (!bible.find(id)) return;
    setState(current => ({ ...current, likes: current.likes.includes(id)
      ? current.likes.filter(saved => saved !== id) : [...current.likes, id] }));
  }, []);
  const setFontLevel = useCallback((fontLevel: FontLevel) => {
    if (!writable.current || busyRef.current) return;
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(fontPreferenceKey, String(fontLevel))).catch(() => setStorageError(true));
    setState(current => current.fontLevel === fontLevel ? current : { ...current, fontLevel });
  }, []);
  const addComment = useCallback((verseId: string, value: string) => {
    if (!writable.current || busyRef.current) return;
    const text = value.trim().slice(0, 1000);
    if (!bible.find(verseId) || !text) return;
    const createdAt = Date.now();
    const comment = { id: `${createdAt}-${Math.random().toString(36).slice(2)}`, verseId, text, createdAt };
    setState(current => ({ ...current, comments: [...current.comments, comment] }));
  }, []);
  const deleteComment = useCallback((id: string) => {
    if (!writable.current || busyRef.current) return;
    setState(current => ({ ...current, comments: current.comments.filter(comment => comment.id !== id) }));
  }, []);

  return <Context.Provider value={{ ...state, ready, userId, syncBusy, syncMessage, syncChoice, syncRecords, importGuest, deleteAccount, storageError, setPosition, toggleBookmark, toggleLike, setFontLevel, addComment, deleteComment }}>
    {children}
  </Context.Provider>;
}

export function useReader() {
  const state = useContext(Context);
  if (!state) throw new Error('읽기 상태를 불러올 수 없습니다.');
  return state;
}
