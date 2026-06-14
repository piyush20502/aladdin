import { handleBrokerCallback } from '@/app/actions/brokers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const brokerName = searchParams.get('broker')

    if (!code || !state || !brokerName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      )
    }

    await handleBrokerCallback(brokerName, code, state)

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(`/?brokerConnected=${brokerName}`, request.url),
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/?brokerError=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}
