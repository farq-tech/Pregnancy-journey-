import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';
import { Txt } from './Txt';

export type TrendPoint = {
  /** Position on the x axis — gestational week for the weight curve. */
  x: number;
  y: number;
};

/** An optional shaded band drawn behind the line, e.g. the published gain range. */
export type TrendBand = {
  points: readonly { x: number; min: number; max: number }[];
  label: string;
};

const HEIGHT = 150;
const PADDING = { top: 12, right: 8, bottom: 22, left: 8 };

/**
 * A small line chart for the tracking screens: her weight over the weeks, her
 * blood pressure over the last readings.
 *
 * Deliberately minimal — no axis library, no gestures. It answers "is this
 * going up, down, or flat, and where does it sit against the band" at a glance,
 * which is the only question a trend on this screen needs to answer.
 *
 * The x axis runs right-to-left to match the rest of the app: the earliest
 * reading sits at the right edge, the most recent at the left.
 */
export function TrendChart({
  points,
  band,
  formatY = (y) => String(Math.round(y * 10) / 10),
  formatX = (x) => String(Math.round(x)),
}: {
  points: readonly TrendPoint[];
  band?: TrendBand;
  formatY?: (y: number) => string;
  formatX?: (x: number) => string;
}) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <Txt size={12.5} color={colors.faint} align="center" lineHeight={1.8}>
        لا قراءات بعد — أضيفي قراءتين على الأقل ليظهر المنحنى.
      </Txt>
    );
  }

  const bandPoints = band?.points ?? [];
  const xs = [...points.map((p) => p.x), ...bandPoints.map((p) => p.x)];
  const ys = [
    ...points.map((p) => p.y),
    ...bandPoints.flatMap((p) => [p.min, p.max]),
  ];

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  // A flat series would otherwise divide by zero; pad it into a visible band.
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || Math.max(1, maxY * 0.1);

  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  // Mirrored so the axis reads right to left.
  const toX = (x: number) => PADDING.left + plotWidth - ((x - minX) / spanX) * plotWidth;
  const toY = (y: number) => PADDING.top + plotHeight - ((y - minY) / spanY) * plotHeight;

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const linePath = sorted
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${toX(point.x)},${toY(point.y)}`)
    .join(' ');

  const sortedBand = [...bandPoints].sort((a, b) => a.x - b.x);
  const bandPath = sortedBand.length
    ? [
        ...sortedBand.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x)},${toY(p.max)}`),
        ...[...sortedBand].reverse().map((p) => `L${toX(p.x)},${toY(p.min)}`),
        'Z',
      ].join(' ')
    : null;

  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Rect
            x={PADDING.left}
            y={PADDING.top}
            width={plotWidth}
            height={plotHeight}
            fill={colors.bg}
            rx={10}
          />
          {bandPath ? <Path d={bandPath} fill={colors.sageSoft} /> : null}
          <Line
            x1={PADDING.left}
            y1={PADDING.top + plotHeight}
            x2={PADDING.left + plotWidth}
            y2={PADDING.top + plotHeight}
            stroke={colors.track}
            strokeWidth={1}
          />
          <Path
            d={linePath}
            stroke={colors.sage}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {sorted.map((point) => (
            <Circle
              key={`${point.x}-${point.y}`}
              cx={toX(point.x)}
              cy={toY(point.y)}
              r={3}
              fill={colors.surface}
              stroke={colors.sage}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}

      <View
        style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <Txt size={11} color={colors.faint}>
          {`${formatX(earliest.x)} · ${formatY(earliest.y)}`}
        </Txt>
        {band ? (
          <Txt size={11} color={colors.sage}>
            {band.label}
          </Txt>
        ) : null}
        <Txt size={11} color={colors.faint}>
          {`${formatX(latest.x)} · ${formatY(latest.y)}`}
        </Txt>
      </View>
    </View>
  );
}
