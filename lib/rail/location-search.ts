export type LocationSuggestion = {
  id: string;
  name: string;
  type: 'location' | 'station';
  label: string;
  stations?: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
  }>;
  lat?: number;
  lon?: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  category: string;
  osm_type: string;
  osm_id: number;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

function headers() {
  return {
    'User-Agent': 'Choo-Chose-A-Ride/1.0 (UK journey search)',
    Accept: 'application/json',
  };
}

async function geocode(query: string): Promise<NominatimResult[]> {
  const url = new URL(NOMINATIM);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('countrycodes', 'gb');
  url.searchParams.set('limit', '8');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, {
    headers: headers(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Location lookup failed (${response.status})`);
  }

  return response.json();
}

async function nearbyStations(lat: number, lon: number) {
  const radius = 15000;
  const query = `
[out:json][timeout:10];
(
  node(around:${radius},${lat},${lon})["railway"="station"];
  way(around:${radius},${lat},${lon})["railway"="station"];
  relation(around:${radius},${lat},${lon})["railway"="station"];
);
out center tags;
`;

  const response = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Station lookup failed (${response.status})`);
  }

  const data = (await response.json()) as { elements: OverpassElement[] };

  const stations = data.elements
    .map((element) => {
      const latValue = element.lat ?? element.center?.lat;
      const lonValue = element.lon ?? element.center?.lon;
      const name = element.tags?.name;

      if (!latValue || !lonValue || !name) return null;

      return {
        id: `${element.type}-${element.id}`,
        name,
        lat: latValue,
        lon: lonValue,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return stations
    .filter((station, index, array) =>
      array.findIndex((x) => x.name.toLowerCase() === station.name.toLowerCase()) === index
    )
    .slice(0, 8);
}

export async function searchUkLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) return [];

  const places = await geocode(trimmed);

  const results: LocationSuggestion[] = [];

  for (const place of places.slice(0, 6)) {
    const lat = Number(place.lat);
    const lon = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const stations = await nearbyStations(lat, lon);

    results.push({
      id: `place-${place.osm_type}-${place.osm_id}`,
      name: place.display_name.split(',')[0],
      label: place.display_name,
      type: 'location',
      lat,
      lon,
      stations,
    });
  }

  return results;
}
