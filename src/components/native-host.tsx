import { Host } from '@expo/ui';
import type { ReactNode } from 'react';

export function NativeHost({ children }: { children: ReactNode }) {
  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {children}
    </Host>
  );
}
