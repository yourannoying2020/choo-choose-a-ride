import { NextRequest, NextResponse } from 'next/server';
import { searchJourneys } from '@/lib/rail/free-provider';

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

    const journeys = await searchJourneys({
      from: String(from),
      to: String(to),
      date: String(date),
      departAfter: String(departAfter),
      departBefore: String(departBefore),
      maxChanges: String(maxChanges),
      maxPrice: Number(maxPrice),
    });

    return NextResponse.json({
      journeys,
      source: 'UK open/free rail data',
    });
  } catch (error) {
    console.error('Rail search failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Rail search is temporarily unavailable.',
      },
      { status: 502 }
    );
  }
}
