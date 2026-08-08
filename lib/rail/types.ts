export type RailLocation={name:string;type:'location'|'station';stations:string[]};
export type SearchRequest={from:string;to:string;date:string;departAfter:string;departBefore:string;maxChanges:'direct'|'1'|'2'|'any';maxPrice:number};
export type Journey={id:string;departure:string;arrival:string;from:string;to:string;durationMinutes:number;changes:number;price:number;operator:string;status?:string};
export interface RailProvider{search(request:SearchRequest,origin:RailLocation,destination:RailLocation):Promise<Journey[]>;}
