import { NextRequest, NextResponse } from 'next/server';
import { searchUkLocations } from '@/lib/rail/location-search';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';

  if (q.trim().length < 2) {
    return NextResponse.json({ locations: [] });
  }

  try {
    const locations = await searchUkLocations(q);
    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Location search failed:', error);
    return NextResponse.json(
      { error: 'Location search is temporarily unavailable.', locations: [] },
      { status: 502 }
    );
  }
}
