import * as ImagePicker from 'expo-image-picker';

export async function pickCoverUri(): Promise<string | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return undefined;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled) {
    return undefined;
  }
  return result.assets[0]?.uri;
}
