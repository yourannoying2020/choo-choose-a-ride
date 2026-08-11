import { NextRequest, NextResponse } from 'next/server';
import { searchOjpJourneys } from '@/lib/rail/ojp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      from,
      to,
      date,
      departAfter = '06:00',
      departBefore = '22:00',
      maxChanges = 'any',
      maxPrice = 100,
    } = body ?? {};

    if (!from || !to || !date) {
      return NextResponse.json(
        { error: 'From, To and date are required.' },
        { status: 400 }
      );
    }

    const journeys = await searchOjpJourneys({
      from: String(from),
      to: String(to),
      date: String(date),
      departAfter: String(departAfter),
      departBefore: String(departBefore),
      maxChanges: String(maxChanges),
      maxPrice: Number(maxPrice),
    });

    return NextResponse.json({ journeys, source: 'National Rail OJP' });
  } catch (error) {
    console.error('Rail search failed:', error);

    const message =
      error instanceof Error ? error.message : 'Rail search failed.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
