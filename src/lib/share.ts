import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

export async function shareOrCopy(message: string, url: string): Promise<'shared' | 'copied'> {
  try {
    const result = await Share.share({ message, url });
    if (result.action === Share.dismissedAction) {
      await Clipboard.setStringAsync(url);
      return 'copied';
    }
    return 'shared';
  } catch {
    await Clipboard.setStringAsync(url);
    return 'copied';
  }
}

export async function copyText(value: string): Promise<void> {
  await Clipboard.setStringAsync(value);
}
