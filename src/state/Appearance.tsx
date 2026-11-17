import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

export const backgrounds = [
  { name: '기본색', color: '#FCFAF6' }, { name: '화이트', color: '#FFFFFF' },
  { name: '세이지', color: '#F4F8F3' }, { name: '하늘', color: '#F5F8FC' },
  { name: '라벤더', color: '#F8F5FC' }, { name: '로즈', color: '#FCF6F5' },
];
// 이전 배경 선택도 같은 색상 계열의 옅은 색으로 이어갑니다.
const previousColors: Record<string, string> = {
  '#F7F3EA': '#FCFAF6', '#E5EDE3': '#F4F8F3', '#E8EFF6': '#F5F8FC',
  '#EEE9F4': '#F8F5FC', '#F6E8E5': '#FCF6F5',
};
const key = 'upbible:appearance:v1';
const Context = createContext({ background: backgrounds[0].color, ready: false, reduceMotion: false,
  error: false, setBackground: (_: string) => {} });
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [background, update] = useState(backgrounds[0].color);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then(value => {
      const selected = value ? (previousColors[value] ?? value) : null;
      if (active && backgrounds.some(item => item.color === selected)) update(selected!);
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setReady(true); });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (ready) void AsyncStorage.setItem(key, background).catch(() => setError(true));
  }, [background, ready]);
  return <Context.Provider value={{ background, ready, reduceMotion, error,
    setBackground: value => { if (ready && backgrounds.some(item => item.color === value)) update(value); } }}>{children}</Context.Provider>;
}
export const useAppearance = () => useContext(Context);
