import { I18nManager } from 'react-native';

// The whole UI is authored right-to-left explicitly (row-reverse rows, textAlign
// 'right'), so we deliberately keep the layout engine in its LTR base direction.
// Letting iOS flip the layout as well would double-mirror every row. Arabic text
// itself still shapes and orders correctly — that is the Unicode bidi algorithm,
// not I18nManager.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

import 'expo-router/entry';
