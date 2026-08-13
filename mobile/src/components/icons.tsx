import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

/**
 * The prototype's inline SVGs, transcribed path-for-path. All are drawn on a
 * 24×24 viewBox with a stroked outline and no fill, Lucide-style.
 */
type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function HeartIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C7 16.5 3 13.2 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 3.9-4 7.2-9 11.7Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 3v4M16 3v4M3 10h18" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function BabyIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="5" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M10 8h.01M14 8h.01M10.5 10.5c.5.5 2.5.5 3 0M12 13v3m0 0c-3 0-5.5 2-5.5 4.5h11C17.5 18 15 16 12 16Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function ClockIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function JournalIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M5 4a2 2 0 0 0 0 4h14M9 12h6M9 15.5h4" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function FileIcon({ size = 21, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path d="M14 3v5h5M9 13h6M9 17h4" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function SettingsIcon({ size = 18, color = colors.sage, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = colors.sage, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

/**
 * Chevron. `direction` is where it points on screen: in an RTL layout "forward"
 * points left, which is why the default is `left`.
 */
export function ChevronIcon({
  size = 16,
  color = colors.sage,
  strokeWidth = 2,
  direction = 'left',
}: IconProps & { direction?: 'left' | 'right' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={direction === 'left' ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
