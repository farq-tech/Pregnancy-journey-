/**
 * Design tokens transcribed from the Claude Design prototype
 * (`project/Pregnancy Journey.dc.html`). Every value here appears literally in
 * that file — do not "tidy" them into a rounder scale, the prototype is the
 * spec.
 */

export const colors = {
  /** App canvas. */
  bg: '#F8F7F2',
  /** The page behind the device frame in the prototype; used for sheet scrims. */
  canvas: '#EDEBE3',
  surface: '#FFFFFF',
  /** Card gradient end on the Today hero. */
  surfaceWarm: '#F4F2E9',
  border: '#E3E1D5',
  borderDashed: '#D5D2C3',

  text: '#2C332B',
  /** Long-form body copy inside cards. */
  body: '#3D4439',
  muted: '#85826F',
  faint: '#A5A292',

  sage: '#5E6F5C',
  sageDark: '#4E5D4C',
  sageRing: '#7D8F7B',
  sageSoft: '#EEF1EA',
  sageBorder: '#D8DFD3',
  sageMid: '#AEBCA9',

  clay: '#C2857E',
  clayDeep: '#B0776F',
  clayText: '#8B6E69',
  claySoft: '#F6EFED',
  clayBorder: '#EAD9D4',
  clayHeading: '#8B5850',
  clayBody: '#6E5450',
  clayFaint: '#A98680',
  clayDelete: '#C9A8A2',

  error: '#A9564B',
  errorBg: '#F7ECEA',

  /** Progress ring track / hairlines. */
  track: '#E9E7DA',

  /** Calendar legend dots. */
  dotWeek: '#7D8F7B',
  dotAppt: '#C2857E',
  dotJournal: '#B7A26B',
  dotRecord: '#8A9BB0',

  navActive: '#4E5D4C',
  navInactive: '#A5A292',
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  pill: 999,
} as const;

/**
 * Rubik weights. Keys match the numeric CSS weights used in the prototype so a
 * style can say `fontFamily: fonts[600]` next to `fontSize: 15`.
 */
export const fonts = {
  400: 'Rubik_400Regular',
  500: 'Rubik_500Medium',
  600: 'Rubik_600SemiBold',
  700: 'Rubik_700Bold',
} as const;

export type FontWeightKey = keyof typeof fonts;
