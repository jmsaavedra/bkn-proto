import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import SalaryCap from '@/lib/models/SalaryCap'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const season = searchParams.get('season')

    if (season) {
      const cap = await SalaryCap.findOne({ season }).lean()
      if (!cap) {
        return NextResponse.json(
          { error: 'Salary cap data not found for season' },
          { status: 404 }
        )
      }
      return NextResponse.json(cap)
    }

    const caps = await SalaryCap.find({})
      .sort({ season: -1 })
      .lean()

    return NextResponse.json(caps)
  } catch (error) {
    console.error('Error fetching salary cap:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary cap data' },
      { status: 500 }
    )
  }
}
