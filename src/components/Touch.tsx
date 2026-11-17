import { Pressable as NativePressable } from 'react-native';
import type { PressableProps } from 'react-native';

export function Pressable({ style, ...props }: PressableProps) {
  return <NativePressable {...props} style={state => [typeof style === 'function' ? style(state) : style,
    state.pressed && !props.disabled && { opacity: 0.65, transform: [{ scale: 0.96 }] }]} />;
}
