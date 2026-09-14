import * as Haptics from 'expo-haptics';

export function lightCheckHaptic(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
