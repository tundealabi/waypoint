import { useNetworkState } from 'expo-network';

export function useOnline(): boolean {
  const network = useNetworkState();
  if (network.isConnected === false) {
    return false;
  }
  if (network.isInternetReachable === false) {
    return false;
  }
  return true;
}
