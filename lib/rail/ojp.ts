type SearchArgs = {
  from: string;
  to: string;
  date: string;
  departAfter: string;
  departBefore: string;
  maxChanges: string;
  maxPrice: number;
};

type Station = {
  name: string;
  crs: string;
};

const OJP_URL =
  process.env.NATIONAL_RAIL_OJP_URL ??
  'https://ojp.nationalrail.co.uk/webservices';

const USERNAME = process.env.NATIONAL_RAIL_USERNAME;
const PASSWORD = process.env.NATIONAL_RAIL_PASSWORD;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function tag(xml: string, name: string) {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${name}>`,
    'i'
  );
  return xml.match(re)?.[1]?.trim() ?? '';
}

function tags(xml: string, name: string) {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${name}>`,
    'gi'
  );
  return [...xml.matchAll(re)].map((m) => m[1].trim());
}

function blocks(xml: string, name: string) {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9_]+:)?${name}>`,
    'gi'
  );
  return [...xml.matchAll(re)].map((m) => m[1]);
}

function toIso(date: string, time: string) {
  return `${date}T${time}:00`;
}

function minutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

async function resolveStation(input: string): Promise<Station> {
  // Allow the user to enter a CRS code directly.
  if (/^[A-Z]{3}$/i.test(input.trim())) {
    return { name: input.trim().toUpperCase(), crs: input.trim().toUpperCase() };
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', `${input.trim()} railway station`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('countrycodes', 'gb');
  url.searchParams.set('limit', '5');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Choo-Chose-A-Ride/1.0 (UK journey search)',
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Could not resolve station "${input}".`);
  }

  const places = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!places.length) {
    throw new Error(`Could not find a UK railway station for "${input}".`);
  }

  // Ask Overpass for the railway station's tags. The "ref" tag is normally
  // the National Rail CRS code.
  const first = places[0];
  const query = `
[out:json][timeout:10];
node(around:2500,${first.lat},${first.lon})["railway"="station"];
out tags center;
`;

  const overpass = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'User-Agent': 'Choo-Chose-A-Ride/1.0 (UK journey search)',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 3600 },
  });

  if (!overpass.ok) {
    throw new Error(`Could not resolve the CRS code for "${input}".`);
  }

  const data = (await overpass.json()) as {
    elements?: Array<{
      tags?: { name?: string; ref?: string };
    }>;
  };

  const wanted = input.trim().toLowerCase();
  const candidates = (data.elements ?? [])
    .map((x) => x.tags)
    .filter((x): x is { name?: string; ref?: string } => Boolean(x?.name && x?.ref))
    .filter((x) => /^[A-Z]{3}$/i.test(x.ref!));

  const match =
    candidates.find((x) => x.name!.toLowerCase() === wanted) ??
    candidates.find((x) => x.name!.toLowerCase().includes(wanted)) ??
    candidates[0];

  if (!match?.ref) {
    throw new Error(
      `Found "${first.display_name.split(',')[0]}", but could not determine its National Rail station code.`
    );
  }

  return {
    name: match.name!,
    crs: match.ref.toUpperCase(),
  };
}

function buildRequest(
  from: Station,
  to: Station,
  date: string,
  time: string,
  direct: boolean
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
 xmlns:jpd="http://www.thalesgroup.com/ojp/jpdlr"
 xmlns:com="http://www.thalesgroup.com/ojp/common">
  <soapenv:Header/>
  <soapenv:Body>
    <jpd:RealtimeJourneyPlanRequest>
      <jpd:origin>
        <com:stationCRS>${escapeXml(from.crs)}</com:stationCRS>
      </jpd:origin>
      <jpd:destination>
        <com:stationCRS>${escapeXml(to.crs)}</com:stationCRS>
      </jpd:destination>
      <jpd:realtimeEnquiry>STANDARD</jpd:realtimeEnquiry>
      <jpd:outwardTime>
        <jpd:departBy>${escapeXml(toIso(date, time))}</jpd:departBy>
      </jpd:outwardTime>
      <jpd:directTrains>${direct ? 'true' : 'false'}</jpd:directTrains>
      <jpd:fareRequestDetails>
        <jpd:passengers>
          <com:adult>1</com:adult>
          <com:child>0</com:child>
        </jpd:passengers>
        <jpd:fareClass>ANY</jpd:fareClass>
      </jpd:fareRequestDetails>
      <jpd:includeAdditionalInformation>true</jpd:includeAdditionalInformation>
    </jpd:RealtimeJourneyPlanRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function callOjp(xml: string) {
  if (!USERNAME || !PASSWORD) {
    throw new Error(
      'Live rail data is not configured yet. Add NATIONAL_RAIL_USERNAME and NATIONAL_RAIL_PASSWORD to Vercel.'
    );
  }

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  const response = await fetch(OJP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'text/xml; charset=utf-8',
      Accept: 'text/xml, application/xml',
    },
    body: xml,
    cache: 'no-store',
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`National Rail OJP returned HTTP ${response.status}.`);
  }

  const fault = tag(body, 'faultstring') || tag(body, 'response');
  if (fault && /error|fault|no_journeys|station_does_not_exist/i.test(fault)) {
    throw new Error(`National Rail: ${fault}`);
  }

  return body;
}

function parseJourneys(xml: string, from: string, to: string) {
  return blocks(xml, 'outwardJourney').map((journey, index) => {
    const scheduled = blocks(journey, 'scheduled')[0] ?? '';
    const realtime = blocks(journey, 'realtime')[0] ?? '';

    const scheduledDeparture = tag(scheduled, 'departure');
    const scheduledArrival = tag(scheduled, 'arrival');

    const realtimeDeparture = tag(realtime, 'departure');
    const realtimeArrival = tag(realtime, 'arrival');

    const departureIso = realtimeDeparture || scheduledDeparture;
    const arrivalIso = realtimeArrival || scheduledArrival;

    const legs = blocks(journey, 'leg');
    const fareBlocks = blocks(journey, 'fare');

    const fareValues = fareBlocks
      .map((fare) => Number(tag(fare, 'totalPrice')))
      .filter((x) => Number.isFinite(x) && x >= 0);

    const pricePence =
      fareValues.length ? Math.min(...fareValues) : Number.POSITIVE_INFINITY;

    const departure = new Date(departureIso);
    const arrival = new Date(arrivalIso);
    const durationMinutes = Math.max(
      0,
      Math.round((arrival.getTime() - departure.getTime()) / 60000)
    );

    const operators = legs
      .map((leg) => tag(leg, 'name') || tag(blocks(leg, 'operator')[0] ?? '', 'name'))
      .filter(Boolean);

    const codes = legs
      .map((leg) => tag(leg, 'code'))
      .filter(Boolean);

    const operator =
      operators[0] ??
      codes[0] ??
      'National Rail';

    const id = tag(journey, 'id') || String(index + 1);

    return {
      id: `ojp-${id}`,
      from,
      to,
      departure: departureIso.slice(11, 16),
      arrival: arrivalIso.slice(11, 16),
      departureIso,
      arrivalIso,
      durationMinutes,
      changes: Math.max(0, legs.length - 1),
      price: Number.isFinite(pricePence) ? pricePence / 100 : 0,
      operator,
      fareAvailable: Number.isFinite(pricePence),
      trainId: tag(journey, 'trainRetailID') || tag(journey, 'trainUID') || '',
      realtimeClassification: tag(journey, 'realtimeClassification'),
    };
  });
}

export async function searchOjpJourneys(args: SearchArgs) {
  const from = await resolveStation(args.from);
  const to = await resolveStation(args.to);

  const direct = args.maxChanges === 'direct';
  const xml = buildRequest(
    from,
    to,
    args.date,
    args.departAfter,
    direct
  );

  const response = await callOjp(xml);
  let journeys = parseJourneys(response, from.name, to.name);

  const after = minutes(args.departAfter);
  const before = minutes(args.departBefore);
  const maxChanges =
    args.maxChanges === 'any' ? Number.POSITIVE_INFINITY : Number(args.maxChanges);

  journeys = journeys.filter((journey) => {
    const departure = minutes(journey.departure);
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

  return journeys;
}
