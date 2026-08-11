type SearchArgs = {
  from: string; to: string; date: string; departAfter: string;
  departBefore: string; maxChanges: string; maxPrice: number;
};
type Station = { name: string; crs: string };

const DARWIN_URL = process.env.DARWIN_LDB_URL ??
  'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb12.asmx';
const DARWIN_TOKEN = process.env.DARWIN_API_TOKEN;
const LDB_NS = 'http://thalesgroup.com/RTTI/2021-11-01/ldb/';
const TOKEN_NS = 'http://thalesgroup.com/RTTI/2013-11-28/Token/types';

function escapeXml(value:string) {
  return value.replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}
function blocks(xml:string,name:string) {
  const re=new RegExp(`<(?:(?:[A-Za-z0-9_]+):)?${name}\\b[^>]*>([\\s\\S]*?)</(?:(?:[A-Za-z0-9_]+):)?${name}>`,'gi');
  return [...xml.matchAll(re)].map(m=>m[1]);
}
function first(xml:string,name:string) {
  const re=new RegExp(`<(?:(?:[A-Za-z0-9_]+):)?${name}\\b[^>]*>([\\s\\S]*?)</(?:(?:[A-Za-z0-9_]+):)?${name}>`,'i');
  return xml.match(re)?.[1]?.trim() ?? '';
}

async function resolveStation(input:string):Promise<Station> {
  const value=input.trim();
  if (/^[A-Z]{3}$/i.test(value)) return {name:value.toUpperCase(),crs:value.toUpperCase()};

  const u=new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('q',`${value} railway station`);
  u.searchParams.set('format','jsonv2'); u.searchParams.set('countrycodes','gb');
  u.searchParams.set('limit','5');

  const r=await fetch(u,{headers:{'User-Agent':'Choo-Chose-A-Ride/1.0'},next:{revalidate:3600}});
  if(!r.ok) throw new Error(`Could not find a UK station for "${value}".`);
  const places=await r.json() as Array<{display_name:string;lat:string;lon:string}>;
  if(!places.length) throw new Error(`Could not find a UK station for "${value}".`);
  const p=places[0];

  const q=`[out:json][timeout:10];(node(around:3000,${p.lat},${p.lon})["railway"="station"];way(around:3000,${p.lat},${p.lon})["railway"="station"];);out center tags;`;
  const sr=await fetch('https://overpass-api.de/api/interpreter',{
    method:'POST',headers:{'User-Agent':'Choo-Chose-A-Ride/1.0','Content-Type':'application/x-www-form-urlencoded'},
    body:`data=${encodeURIComponent(q)}`,next:{revalidate:3600}
  });
  if(!sr.ok) throw new Error(`Could not resolve the station code for "${value}".`);
  const data=await sr.json() as {elements?:Array<{tags?:{name?:string;ref?:string}}>} ;
  const candidates=(data.elements??[]).map(x=>x.tags).filter(
    (x):x is {name:string;ref:string}=>Boolean(x?.name&&x?.ref&&/^[A-Z]{3}$/i.test(x.ref))
  );
  const wanted=value.toLowerCase();
  const m=candidates.find(x=>x.name.toLowerCase()===wanted) ??
    candidates.find(x=>x.name.toLowerCase().includes(wanted)) ?? candidates[0];
  if(!m) throw new Error(`Found ${p.display_name.split(',')[0]}, but could not determine its National Rail CRS code.`);
  return {name:m.name,crs:m.ref.toUpperCase()};
}

function envelope(from:Station,to:Station) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="${TOKEN_NS}" xmlns:ldb="${LDB_NS}">
<soap:Header><typ:AccessToken><typ:TokenValue>${escapeXml(DARWIN_TOKEN??'')}</typ:TokenValue></typ:AccessToken></soap:Header>
<soap:Body><ldb:GetDepartureBoard><ldb:numRows>150</ldb:numRows><ldb:crs>${escapeXml(from.crs)}</ldb:crs>
<ldb:filterCrs>${escapeXml(to.crs)}</ldb:filterCrs><ldb:filterType>to</ldb:filterType>
<ldb:timeOffset>0</ldb:timeOffset><ldb:timeWindow>120</ldb:timeWindow></ldb:GetDepartureBoard></soap:Body>
</soap:Envelope>`;
}

async function callDarwin(xml:string) {
  if(!DARWIN_TOKEN) throw new Error('Register for the free Darwin feed and add DARWIN_API_TOKEN to Vercel.');
  const r=await fetch(DARWIN_URL,{method:'POST',headers:{
    'Content-Type':'text/xml; charset=utf-8',
    Accept:'text/xml, application/xml',
    SOAPAction:'"http://thalesgroup.com/RTTI/2021-11-01/ldb/GetDepartureBoard"'
  },body:xml,cache:'no-store'});
  const body=await r.text();
  if(!r.ok) throw new Error(`Darwin returned HTTP ${r.status}.`);
  const fault=first(body,'faultstring'); if(fault) throw new Error(`Darwin: ${fault}`);
  return body;
}
function mins(v:string){const m=v.match(/(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null;}

function parse(xml:string,from:string,to:string) {
  return blocks(xml,'service').map((s,i)=>{
    const scheduled=first(s,'std'), expected=first(s,'etd');
    if(!scheduled||scheduled==='Cancelled') return null;
    return {
      id:`darwin-${i}-${scheduled}`,
      from,to,departure:scheduled,arrival:first(s,'sta')||'',
      durationMinutes:0,changes:0,price:0,
      operator:first(s,'operator')||'National Rail',
      fareAvailable:false,realtimeDeparture:expected||scheduled,
      cancelled:false,live:true
    };
  }).filter((x):x is NonNullable<typeof x>=>Boolean(x));
}

export async function searchOpenRailJourneys(args:SearchArgs) {
  const d=new Date(`${args.date}T00:00:00`), now=new Date();
  const today=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
  if(!today) throw new Error('Free Darwin Live Departure data currently supports live/current departures. Future-date timetable data will be added from the registered timetable feed.');

  const from=await resolveStation(args.from), to=await resolveStation(args.to);
  let journeys=parse(await callDarwin(envelope(from,to)),from.name,to.name);
  const after=mins(args.departAfter)??0, before=mins(args.departBefore)??1439;
  journeys=journeys.filter(j=>{
    const dep=mins(j.departure); if(dep===null) return false;
    const timeOk=before>=after?dep>=after&&dep<=before:dep>=after||dep<=before;
    const changesOk=args.maxChanges==='any'||args.maxChanges==='direct'||j.changes<=Number(args.maxChanges);
    return timeOk&&changesOk;
  });
  return journeys;
}
