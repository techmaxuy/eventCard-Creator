import { NextResponse } from 'next/server'
import { seedDefaultEventTypes } from '@/features/event-cards/actions/event-types'

const SEED_SECRET = process.env.SEED_SECRET || 'change-me-in-production'

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()
    
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await seedDefaultEventTypes()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Default event types created successfully' 
    })

  } catch (error) {
    console.error('Seed Error:', error)
    return NextResponse.json({ 
      error: 'Failed to seed event types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}