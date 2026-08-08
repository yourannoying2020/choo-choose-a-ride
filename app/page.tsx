'use client';

import { FormEvent, useState } from 'react';

const journeys = [
  {badge:'BEST OVERALL',depart:'07:03',arrive:'09:18',duration:'2h 15m',changes:'Direct',price:39},
  {badge:'CHEAPEST',depart:'07:30',arrive:'10:05',duration:'2h 35m',changes:'1 change',price:28},
  {badge:'FASTEST',depart:'06:33',arrive:'08:45',duration:'2h 12m',changes:'Direct',price:45}
];

export default function Home() {
  const [from,setFrom]=useState('London Euston');
  const [to,setTo]=useState('Manchester Piccadilly');
  const [date,setDate]=useState('2026-08-25');
  const [changes,setChanges]=useState('direct');
  const [price,setPrice]=useState('100');
  const [searched,setSearched]=useState(false);

  function search(e:FormEvent){e.preventDefault();setSearched(true);}

  return <main className="min-h-screen bg-slate-950 text-white">
    <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
      <header className="mb-10">
        <div className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300">🚆 UK Train Search</div>
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">Choo Chose A Ride</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">Find the train that works for you. Compare journeys by departure time, price and changes.</p>
      </header>

      <form onSubmit={search} className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl md:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="From"><input value={from} onChange={e=>setFrom(e.target.value)} className="input" /></Field>
          <Field label="To"><input value={to} onChange={e=>setTo(e.target.value)} className="input" /></Field>
          <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input" /></Field>
          <Field label="Departure window"><div className="grid grid-cols-2 gap-2"><input type="time" defaultValue="06:00" className="input"/><input type="time" defaultValue="22:00" className="input"/></div></Field>
          <Field label="Maximum changes"><select value={changes} onChange={e=>setChanges(e.target.value)} className="input"><option value="direct">Direct only</option><option value="1">Up to 1 change</option><option value="2">Up to 2 changes</option><option value="any">Any number</option></select></Field>
          <Field label="Maximum price"><div className="relative"><span className="absolute left-4 top-3 text-slate-400">£</span><input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" className="input pl-8"/></div></Field>
        </div>
        <button className="mt-5 w-full rounded-2xl bg-sky-500 px-7 py-4 font-bold text-white hover:bg-sky-600 md:w-auto">Find trains</button>
      </form>

      {searched && <section className="mt-10">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-sm text-slate-400">Example results</p><h2 className="text-2xl font-bold">{from} → {to}</h2><p className="mt-1 text-sm text-slate-500">Sample journeys for now — real UK rail data comes next.</p></div>
          <select className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option>Best overall</option><option>Cheapest</option><option>Fastest</option><option>Earliest departure</option></select>
        </div>
        <div className="space-y-4">{journeys.map(j=><article key={j.badge} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div><span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">{j.badge}</span>
              <div className="mt-4 flex items-center gap-4">
                <div><div className="text-2xl font-bold">{j.depart}</div><div className="text-sm text-slate-400">{from}</div></div>
                <div className="min-w-20 text-center text-xs text-slate-500"><div>{j.duration}</div><div className="my-1 h-px bg-slate-700"/><div>{j.changes}</div></div>
                <div><div className="text-2xl font-bold">{j.arrive}</div><div className="text-sm text-slate-400">{to}</div></div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-6 md:block md:text-right"><div className="text-3xl font-bold">£{j.price}</div><button type="button" className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">View journey</button></div>
          </div>
        </article>)}</div>
      </section>}
    </section>
  </main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
