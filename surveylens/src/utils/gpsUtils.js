import * as Location from 'expo-location';

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude.toFixed(6),
      longitude: location.coords.longitude.toFixed(6),
      altitude: location.coords.altitude?.toFixed(1) ?? 'N/A',
    };
  } catch (e) {
    return null;
  }
}

export function formatGPS(gps) {
  if (!gps) return 'No GPS';
  return `${gps.latitude}, ${gps.longitude}`;
}
