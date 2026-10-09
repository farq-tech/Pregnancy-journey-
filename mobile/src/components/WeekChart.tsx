import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import type { WeekPoint } from '../lib/antenatal';
import { colors } from '../theme';
import { Txt } from './Txt';

type Series = {
  points: WeekPoint[];
  color: string;
  label?: string;
};

/**
 * Gestational-week line chart. The plot itself runs left-to-right (week 8 → 36)
 * the way antenatal graphs are read in clinic, even though the rest of the app
 * is RTL.
 */
export function WeekChart({
  title,
  unit,
  series,
  empty,
  reference,
}: {
  title: string;
  unit: string;
  series: Series[];
  empty: string;
  /** Optional dashed guide, e.g. fundal height ≈ week after 24. */
  reference?: { fromWeek: number; toWeek: number; label: string };
}) {
  const points = series.flatMap((s) => s.points);
  if (!points.length) {
    return (
      <View style={{ gap: 6 }}>
        <Txt size={14} weight={600}>
          {title}
        </Txt>
        <Txt size={12.5} color={colors.faint} lineHeight={1.6}>
          {empty}
        </Txt>
      </View>
    );
  }

  const width = 320;
  const height = 148;
  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const weeks = points.map((p) => p.week);
  const values = points.map((p) => p.value);
  const minWeek = Math.max(1, Math.min(...weeks) - 1);
  const maxWeek = Math.min(42, Math.max(...weeks) + 1);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valPad = minVal === maxVal ? Math.max(2, minVal * 0.05) : (maxVal - minVal) * 0.15;
  const yMin = minVal - valPad;
  const yMax = maxVal + valPad;

  const x = (week: number) => padL + ((week - minWeek) / (maxWeek - minWeek || 1)) * innerW;
  const y = (value: number) => padT + (1 - (value - yMin) / (yMax - yMin || 1)) * innerH;

  const pathFor = (pts: WeekPoint[]) =>
    pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.week).toFixed(1)} ${y(p.value).toFixed(1)}`)
      .join(' ');

  const yTicks = [yMin, (yMin + yMax) / 2, yMax];
  const xTicks = [minWeek, Math.round((minWeek + maxWeek) / 2), maxWeek];
  const latest = series
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return last ? `${s.label ? `${s.label} ` : ''}${formatNum(last.value)}` : null;
    })
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
        <Txt size={14} weight={600}>
          {title}
        </Txt>
        <Txt size={12} color={colors.sage}>
          {`${latest} ${unit}`}
        </Txt>
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {yTicks.map((tick) => (
          <Line
            key={`y-${tick}`}
            x1={padL}
            x2={width - padR}
            y1={y(tick)}
            y2={y(tick)}
            stroke={colors.track}
            strokeWidth={1}
          />
        ))}
        {yTicks.map((tick) => (
          <SvgText
            key={`yl-${tick}`}
            x={padL - 6}
            y={y(tick) + 4}
            fill={colors.faint}
            fontSize="10"
            textAnchor="end"
          >
            {formatNum(tick)}
          </SvgText>
        ))}
        {xTicks.map((tick) => (
          <SvgText
            key={`x-${tick}`}
            x={x(tick)}
            y={height - 8}
            fill={colors.faint}
            fontSize="10"
            textAnchor="middle"
          >
            {`أ${tick}`}
          </SvgText>
        ))}
        {reference ? (
          <Line
            x1={x(Math.max(reference.fromWeek, minWeek))}
            y1={y(Math.max(reference.fromWeek, minWeek))}
            x2={x(Math.min(reference.toWeek, maxWeek))}
            y2={y(Math.min(reference.toWeek, maxWeek))}
            stroke={colors.sageMid}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}
        {series.map((s) => (
          <Path
            key={s.color + (s.label ?? '')}
            d={pathFor(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.points.map((p) => (
            <Circle
              key={`${s.color}-${p.week}`}
              cx={x(p.week)}
              cy={y(p.value)}
              r={3.2}
              fill={s.color}
            />
          )),
        )}
      </Svg>
      {reference ? (
        <Txt size={11} color={colors.faint}>
          {reference.label}
        </Txt>
      ) : null}
    </View>
  );
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
