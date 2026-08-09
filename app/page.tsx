'use client';
import {FormEvent,useMemo,useRef,useState} from 'react';

const locations: [string, string[]][] = [
['Bristol',['Bristol Temple Meads','Bristol Parkway']],['London',['London Paddington','London Euston',"London King's Cross",'London Waterloo','London Liverpool Street']],
['Manchester',['Manchester Piccadilly','Manchester Oxford Road','Manchester Victoria']],['Birmingham',['Birmingham New Street','Birmingham Moor Street','Birmingham Snow Hill']],
['Bath',['Bath Spa']],['Cardiff',['Cardiff Central','Cardiff Queen Street']],['Edinburgh',['Edinburgh Waverley','Haymarket']],['Leeds',['Leeds']],['Liverpool',['Liverpool Lime Street','Liverpool South Parkway']]
];

function Box({label,value,setValue}:{label:string;value:string;setValue:(x:string)=>void}){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [matches,setMatches]=useState<any[]>([]);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  async function lookup(q:string){
    if(q.trim().length<2){setMatches([]);setOpen(false);return;}
    setLoading(true);
    try{
      const r=await fetch(`/api/locations?q=${encodeURIComponent(q.trim())}`);
      const d=await r.json();
      setMatches(d.locations||[]);
      setOpen(true);
    }catch{
      setMatches([]);
    }finally{
      setLoading(false);
    }
  }

  return <div className="relative">
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    <input
      value={value}
      onChange={e=>{
        const next=e.target.value;
        setValue(next);
        setOpen(true);
        if(timer.current) clearTimeout(timer.current);
        timer.current=setTimeout(()=>lookup(next),350);
      }}
      onFocus={()=>{if(value.trim().length>=2) lookup(value)}}
      onBlur={()=>setTimeout(()=>setOpen(false),150)}
      className="input"
      placeholder="Town, city, postcode or station"
      autoComplete="off"
    />
    {open&&(loading||matches.length>0)&&<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
      {loading&&<div className="px-4 py-3 text-sm text-slate-500">Searching UK locations…</div>}
      {!loading&&matches.map((x:any)=><div key={x.id} className="border-b border-slate-100 last:border-0">
        <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{setValue(x.name);setOpen(false)}} className="block w-full px-4 py-3 text-left hover:bg-slate-50">
          <b>📍 {x.name}</b><div className="truncate text-xs text-slate-500">{x.label}</div>
        </button>
        {(x.stations||[]).slice(0,4).map((s:any)=><button key={s.id} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{setValue(s.name);setOpen(false)}} className="block w-full border-t border-slate-100 bg-slate-50 px-6 py-2 text-left text-sm hover:bg-slate-100">🚆 {s.name}</button>)}
      </div>)}
    </div>}
  </div>
}

export default function Home(){
 const [from,setFrom]=useState('Bristol'),[to,setTo]=useState('London'),[date,setDate]=useState('2026-08-25'),[after,setAfter]=useState('06:00'),[before,setBefore]=useState('22:00'),[changes,setChanges]=useState('any'),[price,setPrice]=useState('100'),[sort,setSort]=useState('best'),[loading,setLoading]=useState(false),[error,setError]=useState(''),[journeys,setJourneys]=useState<any[]>([]);
 async function search(e:FormEvent){e.preventDefault();setLoading(true);setError('');try{const r=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({from,to,date,departAfter:after,departBefore:before,maxChanges:changes,maxPrice:Number(price)})});const d=await r.json();if(!r.ok)throw new Error(d.error);setJourneys(d.journeys)}catch(e:any){setError(e.message||'Search failed')}finally{setLoading(false)}}
 const shown=[...journeys].sort((a,b)=>sort==='cheap'?a.price-b.price:sort==='fast'?a.durationMinutes-b.durationMinutes:sort==='early'?a.departure.localeCompare(b.departure):(a.price+a.durationMinutes/10+a.changes*15)-(b.price+b.durationMinutes/10+b.changes*15));
 return <main className="min-h-screen bg-slate-950 text-white"><section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
 <header className="mb-10"><div className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300">🚆 UK Train Search</div><h1 className="text-4xl font-black tracking-tight md:text-6xl">Choo Chose A Ride</h1><p className="mt-4 max-w-2xl text-lg text-slate-400">Search from any UK location, find the relevant stations and compare journeys by price, time and changes.</p></header>
 <form onSubmit={search} className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl md:p-7"><div className="grid gap-4 md:grid-cols-2"><Box label="From" value={from} setValue={setFrom}/><Box label="To" value={to} setValue={setTo}/>
 <label><span className="mb-2 block text-sm font-semibold">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input"/></label>
 <label><span className="mb-2 block text-sm font-semibold">Departure window</span><div className="grid grid-cols-2 gap-2"><input type="time" value={after} onChange={e=>setAfter(e.target.value)} className="input"/><input type="time" value={before} onChange={e=>setBefore(e.target.value)} className="input"/></div></label>
 <label><span className="mb-2 block text-sm font-semibold">Maximum changes</span><select value={changes} onChange={e=>setChanges(e.target.value)} className="input"><option value="direct">Direct only</option><option value="1">Up to 1 change</option><option value="2">Up to 2 changes</option><option value="any">Any number</option></select></label>
 <label><span className="mb-2 block text-sm font-semibold">Maximum price</span><div className="relative"><span className="absolute left-4 top-3 text-slate-400">£</span><input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} className="input pl-8"/></div></label></div>
 <button disabled={loading} className="mt-5 w-full rounded-2xl bg-sky-500 px-7 py-4 font-bold text-white hover:bg-sky-600 disabled:opacity-60 md:w-auto">{loading?'Searching…':'Find trains'}</button></form>
 {error&&<div className="mt-6 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-red-200">{error}</div>}
 {journeys.length>0&&<section className="mt-10"><div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm text-slate-400">Search results</p><h2 className="text-2xl font-bold">{from} → {to}</h2><p className="text-sm text-slate-500">Showing journeys that match your filters.</p></div><select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option value="best">Best overall</option><option value="cheap">Cheapest</option><option value="fast">Fastest</option><option value="early">Earliest departure</option></select></div>
 <div className="space-y-4">{shown.map((j,i)=><article key={j.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">{i===0&&sort==='best'?'BEST OVERALL':sort==='cheap'?'CHEAPEST':sort==='fast'?'FASTEST':'EARLIEST'}</span><div className="mt-4 flex items-center gap-4"><div><div className="text-2xl font-bold">{j.departure}</div><div className="text-sm text-slate-400">{j.from}</div></div><div className="min-w-20 text-center text-xs text-slate-500"><div>{Math.floor(j.durationMinutes/60)}h {j.durationMinutes%60}m</div><div className="my-1 h-px bg-slate-700"/><div>{j.changes===0?'Direct':`${j.changes} change${j.changes>1?'s':''}`}</div></div><div><div className="text-2xl font-bold">{j.arrival}</div><div className="text-sm text-slate-400">{j.to}</div></div></div></div><div className="text-right"><div className="text-3xl font-bold">£{j.price}</div><div className="text-xs text-slate-500">{j.operator}</div></div></div></article>)}</div></section>}
 {journeys.length===0&&!loading&&!error&&<div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Search above to find matching journeys. Live rail data will replace the mock provider when credentials are added.</div>}
 </section></main>
}
