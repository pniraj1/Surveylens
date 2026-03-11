import * as Location from 'expo-location';

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

// [FIX E2] GPS with timeout — won't hang forever
export async function getCurrentLocation(timeoutMs = 8000) {
  try {
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GPS timeout')), timeoutMs)
    );

    const location = await Promise.race([locationPromise, timeoutPromise]);

    return {
      latitude: location.coords.latitude.toFixed(6),
      longitude: location.coords.longitude.toFixed(6),
      altitude: location.coords.altitude?.toFixed(1) ?? 'N/A',
    };
  } catch (e) {
    // GPS failed or timed out — return null gracefully
    console.warn('GPS error (non-fatal):', e.message);
    return null;
  }
}

export function formatGPS(gps) {
  if (!gps) return 'No GPS';
  return `${gps.latitude}, ${gps.longitude}`;
}
