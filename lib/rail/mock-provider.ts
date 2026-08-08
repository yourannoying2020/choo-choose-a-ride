import type {RailProvider,SearchRequest,Journey,RailLocation} from './types';

const mock:Journey[]=[
{id:'1',departure:'07:03',arrival:'09:18',from:'Bristol Temple Meads',to:'London Paddington',durationMinutes:135,changes:0,price:39,operator:'Great Western Railway'},
{id:'2',departure:'07:30',arrival:'10:05',from:'Bristol Parkway',to:'London Paddington',durationMinutes:155,changes:1,price:28,operator:'CrossCountry / GWR'},
{id:'3',departure:'06:33',arrival:'08:45',from:'Bristol Temple Meads',to:'London Paddington',durationMinutes:132,changes:0,price:45,operator:'Great Western Railway'}
];

export const mockProvider:RailProvider={
 async search(_request:SearchRequest,_origin:RailLocation,_destination:RailLocation){
  return mock;
 }
};
