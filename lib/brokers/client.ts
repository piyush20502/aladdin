import axios, { AxiosInstance } from 'axios'
import { BrokerPortfolio, BrokerHolding, BrokerConfig } from './config'

export class BrokerAPIClient {
  private client: AxiosInstance
  private brokerConfig: BrokerConfig
  private accessToken: string

  constructor(brokerConfig: BrokerConfig, accessToken: string) {
    this.brokerConfig = brokerConfig
    this.accessToken = accessToken
    this.client = axios.create({
      baseURL: brokerConfig.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
  }

  // Fetch holdings from broker
  async fetchHoldings(): Promise<BrokerPortfolio> {
    try {
      switch (this.brokerConfig.id) {
        case 'zerodha':
          return await this.fetchZerodhaHoldings()
        case 'upstox':
          return await this.fetchUpstoxHoldings()
        case 'groww':
          return await this.fetchGrowwHoldings()
        case 'fyers':
          return await this.fetchFyersHoldings()
        case 'vested':
          return await this.fetchVestedHoldings()
        case 'ind-money':
          return await this.fetchIndMoneyHoldings()
        default:
          throw new Error(`Unsupported broker: ${this.brokerConfig.id}`)
      }
    } catch (error) {
      console.error(`[v0] Error fetching ${this.brokerConfig.name} holdings:`, error)
      throw error
    }
  }

  // Zerodha holdings
  private async fetchZerodhaHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/portfolio/holdings')
    const holdings: BrokerHolding[] = response.data.data.map((holding: any) => ({
      symbol: holding.tradingsymbol,
      name: holding.tradingsymbol,
      quantity: holding.quantity,
      price: holding.last_price,
      value: holding.quantity * holding.last_price,
      currency: 'INR',
      brokerName: 'Zerodha',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'Zerodha',
      holdings,
      totalValue,
      currency: 'INR',
      lastUpdated: new Date(),
    }
  }

  // Upstox holdings
  private async fetchUpstoxHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/portfolio/short-holding')
    const holdings: BrokerHolding[] = (response.data.data || []).map((holding: any) => ({
      symbol: holding.isin,
      name: holding.trading_symbol,
      quantity: holding.quantity,
      price: holding.ltp,
      value: holding.quantity * holding.ltp,
      currency: 'INR',
      brokerName: 'Upstox',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'Upstox',
      holdings,
      totalValue,
      currency: 'INR',
      lastUpdated: new Date(),
    }
  }

  // Groww holdings
  private async fetchGrowwHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/portfolio/holdings')
    const holdings: BrokerHolding[] = (response.data.holdings || []).map((holding: any) => ({
      symbol: holding.symbol,
      name: holding.name,
      quantity: holding.quantity,
      price: holding.currentPrice,
      value: holding.quantity * holding.currentPrice,
      currency: 'INR',
      brokerName: 'Groww',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'Groww',
      holdings,
      totalValue,
      currency: 'INR',
      lastUpdated: new Date(),
    }
  }

  // Fyers holdings
  private async fetchFyersHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/holdings')
    const holdings: BrokerHolding[] = (response.data.data || []).map((holding: any) => ({
      symbol: holding.symbol,
      name: holding.symbol,
      quantity: holding.quantity,
      price: holding.lastPrice,
      value: holding.quantity * holding.lastPrice,
      currency: 'INR',
      brokerName: 'Fyers',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'Fyers',
      holdings,
      totalValue,
      currency: 'INR',
      lastUpdated: new Date(),
    }
  }

  // Vested holdings (US)
  private async fetchVestedHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/portfolio/holdings')
    const holdings: BrokerHolding[] = (response.data.data || []).map((holding: any) => ({
      symbol: holding.ticker,
      name: holding.name,
      quantity: holding.quantity,
      price: holding.currentPrice,
      value: holding.quantity * holding.currentPrice,
      currency: 'USD',
      brokerName: 'Vested',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'Vested',
      holdings,
      totalValue,
      currency: 'USD',
      lastUpdated: new Date(),
    }
  }

  // IND Money holdings
  private async fetchIndMoneyHoldings(): Promise<BrokerPortfolio> {
    const response = await this.client.get('/holdings')
    const holdings: BrokerHolding[] = (response.data.holdings || []).map((holding: any) => ({
      symbol: holding.symbol || holding.ticker,
      name: holding.name,
      quantity: holding.quantity,
      price: holding.price,
      value: holding.quantity * holding.price,
      currency: holding.currency || 'USD',
      brokerName: 'IND Money',
    }))

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
    return {
      brokerName: 'IND Money',
      holdings,
      totalValue,
      currency: 'USD',
      lastUpdated: new Date(),
    }
  }
}
