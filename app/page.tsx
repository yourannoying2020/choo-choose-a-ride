'use client';
import {FormEvent,useMemo,useState} from 'react';

type Suggestion={name:string;stations:string[]};
const suggestions:Suggestion[]=[
{name:'Bristol',stations:['Bristol Temple Meads','Bristol Parkway']},
{name:'London',stations:['London Paddington','London Euston',"London King's Cross",'London Waterloo','London Liverpool Street']},
{name:'Manchester',stations:['Manchester Piccadilly','Manchester Oxford Road','Manchester Victoria']},
{name:'Birmingham',stations:['Birmingham New Street','Birmingham Moor Street','Birmingham Snow Hill']},
{name:'Bath',stations:['Bath Spa']},{name:'Cardiff',stations:['Cardiff Central','Cardiff Queen Street']},
{name:'Edinburgh',stations:['Edinburgh Waverley','Haymarket']},{name:'Leeds',stations:['Leeds']},
{name:'Liverpool',stations:['Liverpool Lime Street','Liverpool South Parkway']}];

const sample=[
{badge:'BEST OVERALL',depart:'07:03',arrive:'09:18',from:'Bristol Temple Meads',to:'London Paddington',duration:'2h 15m',changes:'Direct',price:39},
{badge:'CHEAPEST',depart:'07:30',arrive:'10:05',from:'Bristol Parkway',to:'London Paddington',duration:'2h 35m',changes:'1 change',price:28},
{badge:'FASTEST',depart:'06:33',arrive:'08:45',from:'Bristol Temple Meads',to:'London Paddington',duration:'2h 12m',changes:'Direct',price:45}];

function LocationBox({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}){
const [open,setOpen]=useState(false);
const matches=useMemo(()=>suggestions.filter(s=>s.name.toLowerCase().includes(value.toLowerCase())||s.stations.some(x=>x.toLowerCase().includes(value.toLowerCase()))).slice(0,6),[value]);
return <div className="relative"><span className="mb-2 block text-sm font-semibold">{label}</span>
<input value={value} onChange={e=>{setValue(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} className="input" placeholder="City, town or station"/>
{open&&value&&matches.length>0&&<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
{matches.map(s=><button type="button" key={s.name} onClick={()=>{setValue(s.name);setOpen(false)}} className="block w-full px-4 py-3 text-left hover:bg-slate-50">
<div className="font-semibold">{s.name}</div><div className="text-xs text-slate-500">Location · {s.stations.slice(0,3).join(', ')}</div></button>)}</div>}</div>}

export default function Home(){
const [from,setFrom]=useState('Bristol'),[to,setTo]=useState('London'),[date,setDate]=useState('2026-08-25');
const [changes,setChanges]=useState('any'),[price,setPrice]=useState('100'),[searched,setSearched]=useState(false),[sort,setSort]=useState('Best overall');
function search(e:FormEvent){e.preventDefault();setSearched(true)}
return <main className="min-h-screen bg-slate-950 text-white"><section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
<header className="mb-10"><div className="mb-4 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300">🚆 UK Train Search</div>
<h1 className="text-4xl font-black tracking-tight md:text-6xl">Choo Chose A Ride</h1>
<p className="mt-4 max-w-2xl text-lg text-slate-400">Search from any UK location to any other location, then compare trains by time, price and changes.</p></header>
<form onSubmit={search} className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl md:p-7"><div className="grid gap-4 md:grid-cols-2">
<LocationBox label="From" value={from} setValue={setFrom}/><LocationBox label="To" value={to} setValue={setTo}/>
<label><span className="mb-2 block text-sm font-semibold">Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input"/></label>
<label><span className="mb-2 block text-sm font-semibold">Departure window</span><div className="grid grid-cols-2 gap-2"><input type="time" defaultValue="06:00" className="input"/><input type="time" defaultValue="22:00" className="input"/></div></label>
<label><span className="mb-2 block text-sm font-semibold">Changes</span><select value={changes} onChange={e=>setChanges(e.target.value)} className="input"><option value="direct">Direct only</option><option value="1">Up to 1 change</option><option value="2">Up to 2 changes</option><option value="any">Any number</option></select></label>
<label><span className="mb-2 block text-sm font-semibold">Maximum price</span><div className="relative"><span className="absolute left-4 top-3 text-slate-400">£</span><input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" className="input pl-8"/></div></label></div>
<div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><strong>Location search:</strong> Enter a city or town to search its relevant stations automatically. Select a specific station when you want an exact point.</div>
<button className="mt-5 w-full rounded-2xl bg-sky-500 px-7 py-4 font-bold text-white hover:bg-sky-600 md:w-auto">Find trains</button></form>
{searched&&<section className="mt-10"><div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div>
<p className="text-sm text-slate-400">Search results · sample data</p><h2 className="text-2xl font-bold">{from} → {to}</h2><p className="mt-1 text-sm text-slate-500">Real UK rail data will plug into this search layer next.</p></div>
<select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option>Best overall</option><option>Cheapest</option><option>Fastest</option><option>Earliest departure</option></select></div>
<div className="space-y-4">{sample.map(j=><article key={j.badge} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-6"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
<div><span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">{j.badge}</span><div className="mt-4 flex items-center gap-4">
<div><div className="text-2xl font-bold">{j.depart}</div><div className="text-sm text-slate-400">{j.from}</div></div><div className="min-w-20 text-center text-xs text-slate-500"><div>{j.duration}</div><div className="my-1 h-px bg-slate-700"/><div>{j.changes}</div></div><div><div className="text-2xl font-bold">{j.arrive}</div><div className="text-sm text-slate-400">{j.to}</div></div></div></div>
<div className="flex items-center justify-between gap-6 md:block md:text-right"><div className="text-3xl font-bold">£{j.price}</div><button type="button" className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">View journey</button></div></div></article>)}</div></section>}</section></main>;}
