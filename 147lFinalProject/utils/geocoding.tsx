export async function geocodeLocation(location: string) {
  if (!location.trim()) return null;

  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(location) +
    "&key=" +
    process.env.EXPO_PUBLIC_GEOLOCATION_API_KEY;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK" || json.results.length === 0) {
    console.log("Geocoding failed:", json);
    return null;
  }

  const result = json.results[0];

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    address: result.formatted_address,
  };
}
