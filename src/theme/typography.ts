import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700', color: colors.label },
  title: { fontSize: 22, fontWeight: '600', color: colors.label },
  headline: { fontSize: 17, fontWeight: '600', color: colors.label },
  body: { fontSize: 17, fontWeight: '400', color: colors.label },
  subhead: { fontSize: 15, fontWeight: '400', color: colors.secondaryLabel },
  caption: { fontSize: 12, fontWeight: '400', color: colors.secondaryLabel },
} as const satisfies Record<string, TextStyle>;
