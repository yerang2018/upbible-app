import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { Pressable } from '../components/Touch';
import { backgrounds, useAppearance } from '../state/Appearance';
import { reminderLabel, useDailyReminder } from '../state/DailyReminder';
import { colors } from '../theme';
export default function Settings() {
  const { background, setBackground, ready, error } = useAppearance();
  const reminder = useDailyReminder();
  const shift = (minutes: number) => {
    const total = (reminder.setting.hour * 60 + reminder.setting.minute + minutes + 24 * 60) % (24 * 60);
    reminder.setTime(Math.floor(total / 60), total % 60);
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>설정</Text><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/my')} style={styles.close}><Text>닫기</Text></Pressable></View>
      <Text style={styles.heading}>읽기 배경</Text>
      <Text style={styles.body}>쇼츠와 MY 화면의 배경을 선택하세요.</Text>
      <View style={styles.grid}>{backgrounds.map(item => <Pressable key={item.color} disabled={!ready}
        accessibilityRole="button" accessibilityLabel={`${item.name} 배경`}
        accessibilityState={{ selected: background === item.color }}
        onPress={() => setBackground(item.color)} style={styles.swatchOption}>
        <View style={[styles.swatch, { backgroundColor: item.color }, background === item.color && styles.selectedSwatch]}>
          {background === item.color && <Text style={styles.check}>✓</Text>}
        </View>
        <Text style={[styles.swatchName, background === item.color && styles.selectedName]}>{item.name}</Text>
      </Pressable>)}</View>
      {error && <Text role="alert">배경 설정을 저장하지 못했습니다. 저장 공간을 확인해 주세요.</Text>}
      <Text style={styles.heading}>성경 본문 크기</Text>
      <Text style={styles.body}>성경 읽기 화면 왼쪽 위의 ‘가가가’에서 본문을 보며 바로 조절하세요. 버튼과 메뉴 크기는 유지됩니다.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={styles.readButton}><Text style={{ color: colors.navy }}>성경 읽으며 크기 조절하기 →</Text></Pressable>

      <Text style={styles.heading}>하루 한 절 알림</Text>
      <Text style={styles.body}>정한 시각에 이 기기에서 한 절 읽기를 알려 드립니다. 앱을 열어 두지 않아도 울립니다.</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>알림 받기</Text>
        <Pressable accessibilityRole="switch" accessibilityLabel="하루 한 절 알림 받기"
          accessibilityState={{ checked: reminder.setting.enabled, disabled: !reminder.ready || reminder.busy }}
          disabled={!reminder.ready || reminder.busy} hitSlop={8}
          onPress={() => reminder.setEnabled(!reminder.setting.enabled)}
          style={[styles.switch, reminder.setting.enabled && styles.switchOn]}>
          <View style={[styles.knob, reminder.setting.enabled && styles.knobOn]} />
        </Pressable>
      </View>
      {reminder.setting.enabled && <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>알림 시각</Text>
        <View style={styles.timeControl}>
          <Pressable accessibilityRole="button" accessibilityLabel="알림 시각 30분 앞당기기"
            disabled={reminder.busy} onPress={() => shift(-30)} style={styles.timeButton}>
            <Text style={styles.timeButtonText}>−</Text>
          </Pressable>
          <Text style={styles.timeValue}>{reminderLabel(reminder.setting)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="알림 시각 30분 늦추기"
            disabled={reminder.busy} onPress={() => shift(30)} style={styles.timeButton}>
            <Text style={styles.timeButtonText}>+</Text>
          </Pressable>
        </View>
      </View>}
      {reminder.message ? <Text role="alert" style={styles.notice}>{reminder.message}</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  content: { padding: 24, gap: 14, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '700', color: colors.navy }, close: { padding: 14 },
  heading: { fontSize: 17, color: colors.navy, fontWeight: '700', marginTop: 18 },
  body: { fontSize: 14, lineHeight: 22, color: colors.muted },
  readButton: { minHeight: 50, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, paddingVertical: 4 },
  swatchOption: { width: '31%', minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 7 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  selectedSwatch: { borderWidth: 2, borderColor: colors.navy },
  check: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  swatchName: { color: colors.muted, fontSize: 12 },
  selectedName: { color: colors.navy, fontWeight: '700' },
  settingRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  settingLabel: { color: colors.navy, fontSize: 15, fontWeight: '500' },
  switch: { width: 52, height: 32, borderRadius: 16, padding: 3, backgroundColor: '#E5E7EB' },
  switchOn: { backgroundColor: colors.navy },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.paper },
  knobOn: { alignSelf: 'flex-end' },
  timeControl: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
  timeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  timeButtonText: { color: colors.navy, fontSize: 20, fontWeight: '600' },
  timeValue: { minWidth: 92, textAlign: 'center', color: colors.navy, fontSize: 15, fontWeight: '600' },
  notice: { color: colors.navy, fontSize: 13, lineHeight: 20 },
});
