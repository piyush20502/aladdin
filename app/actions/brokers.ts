'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { brokerConnections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { BrokerAPIClient } from '@/lib/brokers/client'
import { getBrokerConfig, generateOAuthState, BrokerPortfolio } from '@/lib/brokers/config'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// Get all connected brokers for user
export async function getConnectedBrokers() {
  const userId = await getUserId()
  return db
    .select()
    .from(brokerConnections)
    .where(and(eq(brokerConnections.userId, userId), eq(brokerConnections.isConnected, true)))
}

// Initialize broker OAuth connection
export async function initiateBrokerConnection(brokerName: string) {
  const userId = await getUserId()
  const brokerConfig = getBrokerConfig(brokerName)

  if (!brokerConfig) {
    throw new Error(`Broker ${brokerName} not supported`)
  }

  const state = generateOAuthState()

  // Store the state in database for verification
  await db
    .insert(brokerConnections)
    .values({
      userId,
      brokerName,
      brokerType: brokerConfig.type,
      oauthState: state,
      isConnected: false,
      metadata: { initiatedAt: new Date().toISOString() },
    })
    .onConflictDoUpdate({
      target: brokerConnections.brokerName,
      set: { oauthState: state, updatedAt: new Date() },
    })

  // Generate OAuth URL
  const params = new URLSearchParams({
    client_id: process.env[`${brokerName.toUpperCase()}_CLIENT_ID`] || '',
    redirect_uri: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/brokers/callback`,
    scope: brokerConfig.scopes.join(' '),
    state,
    response_type: 'code',
  })

  return `${brokerConfig.oauthUrl}?${params.toString()}`
}

// Handle broker OAuth callback
export async function handleBrokerCallback(brokerName: string, code: string, state: string) {
  const userId = await getUserId()
  const brokerConfig = getBrokerConfig(brokerName)

  if (!brokerConfig) {
    throw new Error(`Broker ${brokerName} not supported`)
  }

  // Verify state for CSRF protection
  const connection = await db
    .select()
    .from(brokerConnections)
    .where(
      and(
        eq(brokerConnections.userId, userId),
        eq(brokerConnections.brokerName, brokerName),
      ),
    )
    .limit(1)

  if (!connection.length || connection[0].oauthState !== state) {
    throw new Error('Invalid OAuth state')
  }

  // Exchange code for access token
  const tokenResponse = await fetch(brokerConfig.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env[`${brokerName.toUpperCase()}_CLIENT_ID`] || '',
      client_secret: process.env[`${brokerName.toUpperCase()}_CLIENT_SECRET`] || '',
      redirect_uri: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/brokers/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange code for token: ${tokenResponse.statusText}`)
  }

  const tokenData = await tokenResponse.json()

  // Update connection with tokens
  await db
    .update(brokerConnections)
    .set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null,
      isConnected: true,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(brokerConnections.id, connection[0].id))

  return { success: true, brokerName }
}

// Fetch holdings from a specific broker
export async function fetchBrokerHoldings(brokerName: string): Promise<BrokerPortfolio | null> {
  const userId = await getUserId()

  const connection = await db
    .select()
    .from(brokerConnections)
    .where(
      and(
        eq(brokerConnections.userId, userId),
        eq(brokerConnections.brokerName, brokerName),
        eq(brokerConnections.isConnected, true),
      ),
    )
    .limit(1)

  if (!connection.length || !connection[0].accessToken) {
    return null
  }

  const brokerConfig = getBrokerConfig(brokerName)
  if (!brokerConfig) return null

  try {
    const client = new BrokerAPIClient(brokerConfig, connection[0].accessToken)
    const portfolio = await client.fetchHoldings()

    // Update last synced time
    await db
      .update(brokerConnections)
      .set({ lastSyncedAt: new Date() })
      .where(eq(brokerConnections.id, connection[0].id))

    return portfolio
  } catch (error) {
    console.error(`[v0] Error fetching ${brokerName} holdings:`, error)
    return null
  }
}

// Fetch holdings from all connected brokers
export async function fetchAllBrokerHoldings() {
  const userId = await getUserId()

  const connections = await db
    .select()
    .from(brokerConnections)
    .where(
      and(
        eq(brokerConnections.userId, userId),
        eq(brokerConnections.isConnected, true),
      ),
    )

  const portfolios = await Promise.all(
    connections.map((conn) => fetchBrokerHoldings(conn.brokerName)),
  )

  return portfolios.filter((p): p is BrokerPortfolio => p !== null)
}

// Disconnect broker
export async function disconnectBroker(brokerName: string) {
  const userId = await getUserId()

  await db
    .update(brokerConnections)
    .set({
      isConnected: false,
      accessToken: null,
      refreshToken: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(brokerConnections.userId, userId),
        eq(brokerConnections.brokerName, brokerName),
      ),
    )

  return { success: true }
}
