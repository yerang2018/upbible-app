import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// 하루 한 절 알림 설정입니다. 알림은 기기에서 직접 예약하며 서버로 보내지 않습니다.
export type ReminderSetting = { enabled: boolean; hour: number; minute: number };
export type ReminderResult = 'scheduled' | 'cancelled' | 'unavailable' | 'denied' | 'failed';

const settingKey = 'upbible:daily-reminder:v1';
const notificationIdKey = 'upbible:daily-reminder/v1/notification';
const channelId = 'daily-verse';

export const defaultReminder: ReminderSetting = { enabled: false, hour: 7, minute: 0 };

const unavailableMessage = '이 버전에는 알림 기능이 없습니다. 앱을 새로 설치한 뒤 다시 켜 주세요.';
const deniedMessage = '알림 권한이 꺼져 있습니다. 아이폰 설정 > 알림에서 업바이블을 허용해 주세요.';

type NotificationsModule = typeof import('expo-notifications');
let loading: Promise<NotificationsModule | null> | null = null;

// 알림 네이티브 모듈이 없는 빌드(이전에 설치한 앱, 웹)에서도 설정 화면이 멈추지 않게 합니다.
async function loadNotifications(): Promise<NotificationsModule | null> {
  if (loading) return loading;
  loading = (async () => {
    if (Platform.OS === 'web') return null;
    try {
      const notifications = await import('expo-notifications');
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
        }),
      });
      return notifications;
    } catch { return null; }
  })();
  return loading;
}

export function normalizeReminder(value: unknown): ReminderSetting {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultReminder;
  const saved = value as Partial<ReminderSetting>;
  const hour = typeof saved.hour === 'number' && Number.isInteger(saved.hour) && saved.hour >= 0 && saved.hour <= 23
    ? saved.hour : defaultReminder.hour;
  return { enabled: saved.enabled === true, hour, minute: saved.minute === 30 ? 30 : 0 };
}

export function reminderLabel(setting: ReminderSetting) {
  const meridiem = setting.hour < 12 ? '오전' : '오후';
  const hour = setting.hour % 12 === 0 ? 12 : setting.hour % 12;
  return `${meridiem} ${hour}:${String(setting.minute).padStart(2, '0')}`;
}

async function cancelScheduled(notifications: NotificationsModule) {
  const id = await AsyncStorage.getItem(notificationIdKey).catch(() => null);
  if (id) {
    try { await notifications.cancelScheduledNotificationAsync(id); } catch { /* 이미 지워진 예약 */ }
    await AsyncStorage.removeItem(notificationIdKey).catch(() => {});
  }
}

export async function applyReminder(setting: ReminderSetting): Promise<ReminderResult> {
  const notifications = await loadNotifications();
  if (!notifications) return 'unavailable';
  try {
    await cancelScheduled(notifications);
    if (!setting.enabled) return 'cancelled';
    const current = await notifications.getPermissionsAsync();
    const status = current.granted ? current : await notifications.requestPermissionsAsync();
    if (!status.granted) return 'denied';
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync(channelId, {
        name: '하루 한 절', importance: notifications.AndroidImportance.DEFAULT,
      });
    }
    const id = await notifications.scheduleNotificationAsync({
      content: { title: '업바이블 · 하루 한 절', body: '오늘의 한 절을 읽어 보세요. 1분이면 충분합니다.', sound: false },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DAILY,
        hour: setting.hour, minute: setting.minute, channelId,
      },
    });
    await AsyncStorage.setItem(notificationIdKey, id);
    return 'scheduled';
  } catch { return 'failed'; }
}

export function useDailyReminder() {
  const [setting, setSetting] = useState<ReminderSetting>(defaultReminder);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // 앱을 다시 설치했거나 OS가 예약을 지웠을 수 있어, 켜 둔 설정은 한 번 다시 예약합니다.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(settingKey).then(async value => {
      let parsed: unknown = null;
      try { parsed = value ? JSON.parse(value) : null; } catch { parsed = null; }
      const saved = normalizeReminder(parsed);
      if (!active) return;
      setSetting(saved);
      if (!saved.enabled) return;
      const result = await applyReminder(saved);
      if (!active || result === 'scheduled' || result === 'cancelled') return;
      setSetting(current => ({ ...current, enabled: false }));
      setMessage(result === 'unavailable' ? unavailableMessage
        : result === 'denied' ? deniedMessage : '알림을 예약하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
    }).catch(() => { if (active) setMessage('알림 설정을 불러오지 못했습니다.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const update = useCallback(async (next: ReminderSetting) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    const result = await applyReminder(next);
    setBusy(false);
    if (result === 'unavailable' || result === 'denied' || result === 'failed') {
      setSetting(current => ({ ...current, enabled: result === 'failed' ? current.enabled : false }));
      setMessage(result === 'unavailable' ? unavailableMessage
        : result === 'denied' ? deniedMessage : '알림을 예약하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      return;
    }
    setSetting(next);
    await AsyncStorage.setItem(settingKey, JSON.stringify(next))
      .catch(() => setMessage('알림 설정을 저장하지 못했습니다.'));
    setMessage(result === 'scheduled' ? `매일 ${reminderLabel(next)}에 알림이 울립니다.` : '');
  }, [busy]);

  const setEnabled = useCallback((enabled: boolean) => { void update({ ...setting, enabled }); }, [setting, update]);
  const setTime = useCallback((hour: number, minute: number) => { void update({ ...setting, hour, minute }); }, [setting, update]);

  return { setting, ready, busy, message, setEnabled, setTime };
}
