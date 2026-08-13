import type { ImageSourcePropType } from 'react-native';

/**
 * The baby visual system (spec §7).
 *
 * One entry per gestational week, 4–40, each carrying the artwork *and* its
 * provenance — alt text, caption, and where the image came from. The metadata is
 * required, not decorative: an unsourced medical illustration is exactly what
 * the spec rules out, and alt text is what makes the emotional centrepiece of
 * the app reachable with a screen reader.
 *
 * It ships empty on purpose. Fetal illustrations have to be licensed or
 * commissioned before they go in a shipping app, and `WeekIllustration` renders
 * a designed placeholder for every week still missing one. Never fill this with
 * scraped images, and never use an ultrasound photograph as the illustration —
 * a scan of one pregnancy is not a picture of this baby.
 *
 * Metro resolves `require` at build time, so paths must be literals; a loop will
 * not work. Add entries as artwork arrives:
 *
 *   4: {
 *     full: require('./baby-weeks/baby-week-04.png'),
 *     thumbnail: require('./baby-weeks/baby-week-04-thumb.png'),
 *     alt: 'رسم توضيحي للجنين في الأسبوع الرابع',
 *     caption: 'الأسبوع الرابع — كتلة خلايا داخل كيس الحمل',
 *     source: { name: '…', url: 'https://…', license: '…' },
 *   },
 */
export type WeekIllustrationAsset = {
  /** Full-size artwork. */
  full: ImageSourcePropType;
  /** Smaller variant for timeline rows; falls back to `full` when absent. */
  thumbnail?: ImageSourcePropType;
  /** Screen-reader description. Required for every image. */
  alt: string;
  /** Visible caption under the image. */
  caption?: string;
  /** Where it came from and under what terms. Required for every image. */
  source: { name: string; url?: string; license: string };
};

export const BABY_WEEK_IMAGES: Partial<Record<number, WeekIllustrationAsset>> = {};
