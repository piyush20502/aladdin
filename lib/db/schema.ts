import { boolean, numeric, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

// Better Auth Tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }),
  updatedAt: timestamp('updatedAt', { withTimezone: true }),
})

// Broker Connections Table
export const brokerConnections = pgTable('broker_connections', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  brokerName: text('broker_name').notNull(), // 'zerodha', 'upstox', 'groww', 'fyers', 'vested', 'ind-money'
  brokerType: text('broker_type').notNull(), // 'india' or 'us'
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  authorizationCode: text('authorization_code'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  oauthState: text('oauth_state'), // For CSRF protection
  isConnected: boolean('is_connected').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  metadata: jsonb('metadata'), // Store broker-specific data
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// App Tables
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  symbol: text('symbol'),
  category: text('category').notNull().default('stocks'),
  region: text('region').notNull().default('india'),
  quantity: numeric('quantity').notNull().default('0'),
  buyPrice: numeric('buy_price').notNull().default('0'),
  currentPrice: numeric('current_price').notNull().default('0'),
  currency: text('currency').notNull().default('INR'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const portfolioSnapshots = pgTable('portfolio_snapshots', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  month: text('month').notNull(),
  netWorthInr: numeric('net_worth_inr').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type BrokerConnection = typeof brokerConnections.$inferSelect
export type Asset = typeof assets.$inferSelect
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect
