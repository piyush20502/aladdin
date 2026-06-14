// Broker Integration Interface
export interface BrokerConfig {
  name: string
  id: string
  type: 'india' | 'us'
  oauthUrl: string
  tokenEndpoint: string
  apiBaseUrl: string
  scopes: string[]
  logo?: string
}

export interface BrokerHolding {
  symbol: string
  name: string
  quantity: number
  price: number
  value: number
  currency: string
  brokerName: string
}

export interface BrokerPortfolio {
  brokerName: string
  holdings: BrokerHolding[]
  totalValue: number
  currency: string
  lastUpdated: Date
}

// Broker Configurations
export const BROKER_CONFIGS: Record<string, BrokerConfig> = {
  zerodha: {
    name: 'Zerodha',
    id: 'zerodha',
    type: 'india',
    oauthUrl: 'https://kite.zerodha.com/connect/login',
    tokenEndpoint: 'https://api.kite.trade/session/token',
    apiBaseUrl: 'https://api.kite.trade',
    scopes: ['read', 'write'],
    logo: '🐯',
  },
  upstox: {
    name: 'Upstox',
    id: 'upstox',
    type: 'india',
    oauthUrl: 'https://api.upstox.com/index/dialog/authorize',
    tokenEndpoint: 'https://api.upstox.com/index/oauth/token',
    apiBaseUrl: 'https://api-v2.upstox.com',
    scopes: ['read', 'write'],
    logo: '📈',
  },
  groww: {
    name: 'Groww',
    id: 'groww',
    type: 'india',
    oauthUrl: 'https://api.groww.in/oauth/authorize',
    tokenEndpoint: 'https://api.groww.in/oauth/token',
    apiBaseUrl: 'https://api.groww.in/v1',
    scopes: ['portfolio', 'holdings'],
    logo: '🌱',
  },
  fyers: {
    name: 'Fyers',
    id: 'fyers',
    type: 'india',
    oauthUrl: 'https://api.fyers.in/api/v3/auth/login',
    tokenEndpoint: 'https://api.fyers.in/api/v3/auth/token',
    apiBaseUrl: 'https://api.fyers.in/api/v3',
    scopes: ['holdings'],
    logo: '💎',
  },
  vested: {
    name: 'Vested',
    id: 'vested',
    type: 'us',
    oauthUrl: 'https://api.vested.co.in/oauth/authorize',
    tokenEndpoint: 'https://api.vested.co.in/oauth/token',
    apiBaseUrl: 'https://api.vested.co.in/api',
    scopes: ['portfolio', 'read'],
    logo: '🇺🇸',
  },
  'ind-money': {
    name: 'IND Money',
    id: 'ind-money',
    type: 'us',
    oauthUrl: 'https://api.indmoney.com/oauth/authorize',
    tokenEndpoint: 'https://api.indmoney.com/oauth/token',
    apiBaseUrl: 'https://api.indmoney.com/v1',
    scopes: ['portfolio', 'holdings'],
    logo: '💰',
  },
}

// Helper function to get broker config
export function getBrokerConfig(brokerName: string): BrokerConfig | undefined {
  return BROKER_CONFIGS[brokerName.toLowerCase()]
}

// Helper function to generate OAuth state token
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
