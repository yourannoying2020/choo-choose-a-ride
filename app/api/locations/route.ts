import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/rail/locations';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  return NextResponse.json({ locations: searchLocations(q) });
}
