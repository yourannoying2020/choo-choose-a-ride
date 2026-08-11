type SearchArgs = {
  from: string;
  to: string;
  date: string;
  departAfter: string;
  departBefore: string;
  maxChanges: string;
  maxPrice: number;
};

type TransportApiResponse = {
  routes?: Array<{
    legs?: Array<{
      departure_time?: string;
      arrival_time?: string;
      mode?: string;
      route?: string;
      operator_name?: string;
      duration?: number;
      departure_point?: { name?: string };
      arrival_point?: { name?: string };
    }>;
    duration?: number;
    fare?: number;
  }>;
};

function minutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function normaliseTime(value?: string) {
  if (!value) return '';
  const match = value.match(/(?:T|\s)(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value.slice(0, 5);
}

function normalisePrice(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n > 1000 ? n / 100 : n;
}

export async function searchJourneys(args: SearchArgs) {
  const appId = process.env.TRANSPORT_API_APP_ID;
  const appKey = process.env.TRANSPORT_API_APP_KEY;

  if (!appId || !appKey) {
    throw new Error(
      'Free UK rail search is not configured yet. Add TRANSPORT_API_APP_ID and TRANSPORT_API_APP_KEY to Vercel. The free TransportAPI plan provides 30 requests per day.'
    );
  }

  const url = new URL('https://transportapi.com/v3/uk/public/journey/planner.json');
  url.searchParams.set('from', args.from);
  url.searchParams.set('to', args.to);
  url.searchParams.set('date', args.date);
  url.searchParams.set('time', args.departAfter);
  url.searchParams.set('type', 'departure');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Journey provider returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as TransportApiResponse;

  const after = minutes(args.departAfter);
  const before = minutes(args.departBefore);
  const maxChanges =
    args.maxChanges === 'any'
      ? Number.POSITIVE_INFINITY
      : args.maxChanges === 'direct'
        ? 0
        : Number(args.maxChanges);

  return (data.routes ?? [])
    .map((route, index) => {
      const legs = route.legs ?? [];
      const railLegs = legs.filter(
        (leg) =>
          String(leg.mode ?? '').toLowerCase().includes('rail') ||
          String(leg.mode ?? '').toLowerCase().includes('train')
      );

      const first = legs[0];
      const last = legs[legs.length - 1];

      const departure = normaliseTime(first?.departure_time);
      const arrival = normaliseTime(last?.arrival_time);

      const departureMinutes = departure ? minutes(departure) : -1;
      const changes = Math.max(0, railLegs.length - 1);
      const price = normalisePrice(route.fare);

      return {
        id: `free-${index}-${departure}-${arrival}`,
        from: first?.departure_point?.name ?? args.from,
        to: last?.arrival_point?.name ?? args.to,
        departure,
        arrival,
        durationMinutes:
          Number(route.duration) ||
          (departureMinutes >= 0 && arrival
            ? Math.max(0, minutes(arrival) - departureMinutes)
            : 0),
        changes,
        price,
        operator:
          railLegs[0]?.operator_name ||
          railLegs[0]?.route ||
          'National Rail',
        fareAvailable: Number.isFinite(price) && price > 0,
        legs,
      };
    })
    .filter((journey) => {
      const departure = minutes(journey.departure);
      if (departure < 0) return false;

      const withinTime =
        before >= after
          ? departure >= after && departure <= before
          : departure >= after || departure <= before;

      const changesOk = journey.changes <= maxChanges;
      const priceOk =
        !Number.isFinite(args.maxPrice) ||
        args.maxPrice <= 0 ||
        !journey.fareAvailable ||
        journey.price <= args.maxPrice;

      return withinTime && changesOk && priceOk;
    });
}
