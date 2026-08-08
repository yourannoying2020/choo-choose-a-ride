import type {RailLocation} from './types';

const locations:RailLocation[]=[
{name:'Bristol',type:'location',stations:['Bristol Temple Meads','Bristol Parkway']},
{name:'London',type:'location',stations:['London Paddington','London Euston',"London King's Cross",'London Waterloo','London Liverpool Street']},
{name:'Manchester',type:'location',stations:['Manchester Piccadilly','Manchester Oxford Road','Manchester Victoria']},
{name:'Birmingham',type:'location',stations:['Birmingham New Street','Birmingham Moor Street','Birmingham Snow Hill']},
{name:'Bath',type:'location',stations:['Bath Spa']},
{name:'Cardiff',type:'location',stations:['Cardiff Central','Cardiff Queen Street']},
{name:'Edinburgh',type:'location',stations:['Edinburgh Waverley','Haymarket']},
{name:'Leeds',type:'location',stations:['Leeds']},
{name:'Liverpool',type:'location',stations:['Liverpool Lime Street','Liverpool South Parkway']}
];

export function resolveLocation(input:string):RailLocation{
 const value=input.trim().toLowerCase();
 const exact=locations.find(x=>x.name.toLowerCase()===value);
 if(exact)return exact;
 const station=locations.find(x=>x.stations.some(s=>s.toLowerCase()===value));
 if(station)return {name:input,type:'station',stations:[input]};
 const partial=locations.find(x=>x.name.toLowerCase().includes(value)||x.stations.some(s=>s.toLowerCase().includes(value)));
 if(partial)return partial;
 return {name:input,type:'location',stations:[input]};
}
export function getLocations(){return locations;}
