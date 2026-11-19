import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

type IconName = 'search' | 'light' | 'heart' | 'comment' | 'chevron' | 'close' | 'up' | 'down' | 'book' | 'bookmark' | 'share' | 'shorts' | 'person' | 'settings';

// 다른 앱이나 아이콘 모음에서 가져오지 않고 직접 작성한 선 도형입니다.
export function LineIcon({ name, size = 22, color = colors.navy, filled = false }: {
  name: IconName; size?: number; color?: string; filled?: boolean;
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    {name === 'search' && <>
      <Circle cx="10.5" cy="10.5" r="6.5" />
      <Path d="m15.5 15.5 5 5" />
    </>}
    {name === 'light' && <>
      <Circle cx="12" cy="12" r="3.25" />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.2 2.2M16.8 16.8L19 19M5 19l2.2-2.2M16.8 7.2L19 5" />
    </>}
    {name === 'heart' && <Path fill={filled ? color : 'none'} d="M12 20s-8-4.8-8-10.2C4 4.9 9.6 3.8 12 7.5c2.4-3.7 8-2.6 8 2.3C20 15.2 12 20 12 20Z" />}
    {name === 'comment' && <Path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM7 9h10M7 13h7" />}
    {name === 'chevron' && <Path d="m8 10 4 4 4-4" />}
    {name === 'close' && <Path d="m6 6 12 12M6 18 18 6" />}
    {name === 'up' && <Path d="m6 14 6-6 6 6" />}
    {name === 'down' && <Path d="m6 10 6 6 6-6" />}
    {name === 'book' && <Path d="M12 5v15M12 6C9 4 5 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-2-1-6-1-9 1Z" />}
    {name === 'bookmark' && <Path fill={filled ? color : 'none'} d="M8 3.5h8a2 2 0 0 1 2 2v13.9q0 1.1-.9.5l-4.55-3.03q-.55-.37-1.1 0L6.9 19.9q-.9.6-.9-.5V5.5a2 2 0 0 1 2-2Z" />}
    {name === 'share' && <>
      <Path d="M12 15V3m-4 4 4-4 4 4M6 11H5a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a1 1 0 0 0-1-1h-1" />
    </>}
    {name === 'shorts' && <>
      <Path d="M9.6 3H18a1.5 1.5 0 0 1 1.5 1.5V15.9q0 .6-.45 1.05L17 19q-.5.5-1.2.5H6.5A1.5 1.5 0 0 1 5 18V7.3q0-.7.5-1.2L7.6 3.9Q8.5 3 9.6 3Z" fill={filled ? color : 'none'} />
      <Path d="M8.2 3.4V15a1.5 1.5 0 0 0 1.5 1.5h9.6M8.6 16.1 5.6 19.1" stroke={filled ? colors.paper : color} />
      <Path d="M12 6.8v6l5-3Z" fill={filled ? colors.paper : color} stroke={filled ? colors.paper : color} strokeWidth={1} />
    </>}
    {name === 'settings' && <>
      <Path d="m10 2-.6 2.2-1.6.9-2.2-.6-2 3.4 1.6 1.6v1.9l-1.6 1.6 2 3.4 2.2-.6 1.6.9L10 19h4l.6-2.3 1.6-.9 2.2.6 2-3.4-1.6-1.6V9.5l1.6-1.6-2-3.4-2.2.6-1.6-.9L14 2Z" />
      <Circle cx="12" cy="10.5" r="3" />
    </>}
    {name === 'person' && <>
      <Circle cx="12" cy="7.5" r="3.5" fill={filled ? color : 'none'} />
      <Path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </>}
  </Svg>;
}
