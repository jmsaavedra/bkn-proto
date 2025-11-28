import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const team = searchParams.get('team')
    const season = searchParams.get('season')
    const sort = searchParams.get('sort') || 'date'
    const order = searchParams.get('order') || 'desc'

    // Build query
    const query: any = {}

    if (type) {
      query.type = { $in: type.split(',') }
    }

    if (season) {
      query.season = season
    }

    if (team) {
      query['teams.teamId'] = team
    }

    // Build sort
    const sortOptions: any = {}
    sortOptions[sort === 'score' ? 'evaluation.compositeScore' : sort] = order === 'asc' ? 1 : -1

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('teams.teamId')
        .lean(),
      Transaction.countDocuments(query),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
