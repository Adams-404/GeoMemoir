import { Coordinates } from '../types';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

export const searchPlaces = async (query: string): Promise<{ name: string; coords: Coordinates }[]> => {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );

    if (!response.ok) throw new Error('Search failed');

    const data: NominatimResult[] = await response.json();

    return data.map(item => ({
      name: item.display_name,
      coords: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};