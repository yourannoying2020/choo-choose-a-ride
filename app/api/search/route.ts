import {NextRequest,NextResponse} from 'next/server';
import {resolveLocation} from '@/lib/rail/locations';
import {getRailProvider} from '@/lib/rail/provider';
import type {SearchRequest,Journey} from '@/lib/rail/types';

function allowed(j:Journey,r:SearchRequest){
 if(j.price>r.maxPrice)return false;
 if(r.maxChanges==='direct'&&j.changes!==0)return false;
 if(r.maxChanges==='1'&&j.changes>1)return false;
 if(r.maxChanges==='2'&&j.changes>2)return false;
 return j.departure>=r.departAfter&&j.departure<=r.departBefore;
}

export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const request:SearchRequest={
   from:String(body.from||''),to:String(body.to||''),date:String(body.date||''),
   departAfter:String(body.departAfter||'00:00'),departBefore:String(body.departBefore||'23:59'),
   maxChanges:(body.maxChanges||'any'),maxPrice:Number(body.maxPrice??9999)
  };
  if(!request.from||!request.to||!request.date)return NextResponse.json({error:'From, to and date are required.'},{status:400});
  const origin=resolveLocation(request.from),destination=resolveLocation(request.to);
  const journeys=(await getRailProvider().search(request,origin,destination)).filter(j=>allowed(j,request));
  return NextResponse.json({provider:process.env.RAIL_PROVIDER||'mock',origin,destination,journeys});
 }catch{return NextResponse.json({error:'Unable to search trains.'},{status:500});}
}
