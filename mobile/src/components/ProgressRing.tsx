import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme';

const SIZE = 170;
const INNER = 142;
/** The prototype draws the ring as a 170px conic gradient over a 142px disc. */
const STROKE = (SIZE - INNER) / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The Today ring. CSS `conic-gradient` has no React Native equivalent, so it is
 * drawn as a stroked SVG arc: same 170/142 geometry, same colours, filling
 * clockwise from twelve o'clock.
 */
export function ProgressRing({
  percent,
  children,
}: {
  /** 0–100. */
  percent: number;
  children: ReactNode;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = (clamped / 100) * CIRCUMFERENCE;

  return (
    <View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.track}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.sageRing}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          // SVG arcs start at three o'clock; the gradient starts at twelve.
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: STROKE,
          left: STROKE,
          width: INNER,
          height: INNER,
          borderRadius: INNER / 2,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}
