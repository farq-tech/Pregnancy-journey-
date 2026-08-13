import type { ImageSourcePropType } from 'react-native';

/**
 * Illustration for each gestational week, 4–40.
 *
 * The design bundle used `<image-slot id="baby-week-NN">` — a drop target in the
 * design tool, to be swapped for licensed artwork later. This registry is that
 * swap point. It ships empty on purpose: fetal illustrations need to be licensed
 * (or commissioned) before they go in an app, and `WeekIllustration` renders a
 * designed placeholder for every week that is still missing.
 *
 * To add artwork, drop `baby-week-04.png` … `baby-week-40.png` into
 * `assets/baby-weeks/` and add a line each. Metro resolves `require` at build
 * time, so the paths must be literals — a loop will not work.
 *
 *   4: require('./baby-weeks/baby-week-04.png'),
 *   5: require('./baby-weeks/baby-week-05.png'),
 */
export const BABY_WEEK_IMAGES: Partial<Record<number, ImageSourcePropType>> = {};
