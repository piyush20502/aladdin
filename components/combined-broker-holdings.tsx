'use client'

import { useEffect, useState } from 'react'
import { fetchAllBrokerHoldings, disconnectBroker } from '@/app/actions/brokers'
import { BrokerPortfolio, BrokerHolding } from '@/lib/brokers/config'
import { Button } from '@/components/ui/button'
import { Loader2, X, Plus } from 'lucide-react'

interface CombinedBrokerHoldingsProps {
  brokerType: 'india' | 'us'
}

export function CombinedBrokerHoldings({ brokerType }: CombinedBrokerHoldingsProps) {
  const [portfolios, setPortfolios] = useState<BrokerPortfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBrokers, setSelectedBrokers] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllBrokerHoldings()
      setPortfolios(data)
      // Select all by default
      setSelectedBrokers(new Set(data.map((p) => p.brokerName)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load portfolios'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (brokerName: string) => {
    try {
      await disconnectBroker(brokerName)
      setPortfolios(portfolios.filter((p) => p.brokerName !== brokerName))
      selectedBrokers.delete(brokerName)
      setSelectedBrokers(new Set(selectedBrokers))
    } catch (err) {
      console.error('[v0] Failed to disconnect broker:', err)
    }
  }

  const toggleBrokerSelection = (brokerName: string) => {
    const newSelected = new Set(selectedBrokers)
    if (newSelected.has(brokerName)) {
      newSelected.delete(brokerName)
    } else {
      newSelected.add(brokerName)
    }
    setSelectedBrokers(newSelected)
  }

  // Calculate combined holdings
  const getCombinedHoldings = () => {
    const combined: Record<string, BrokerHolding & { brokers: string[] }> = {}

    portfolios
      .filter((p) => selectedBrokers.has(p.brokerName))
      .forEach((portfolio) => {
        portfolio.holdings.forEach((holding) => {
          const key = holding.symbol.toUpperCase()
          if (!combined[key]) {
            combined[key] = {
              ...holding,
              brokers: [],
            }
          } else {
            combined[key].quantity += holding.quantity
            combined[key].value = combined[key].quantity * holding.price
          }
          if (!combined[key].brokers.includes(portfolio.brokerName)) {
            combined[key].brokers.push(portfolio.brokerName)
          }
        })
      })

    return Object.values(combined)
  }

  const combinedHoldings = getCombinedHoldings()
  const totalValue = combinedHoldings.reduce((sum, h) => sum + h.value, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    )
  }

  if (portfolios.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No brokers connected</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect a broker to see your holdings here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Broker Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Select Brokers to Combine</h3>
        <div className="flex flex-wrap gap-2">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.brokerName}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                selectedBrokers.has(portfolio.brokerName)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => toggleBrokerSelection(portfolio.brokerName)}
            >
              <input
                type="checkbox"
                checked={selectedBrokers.has(portfolio.brokerName)}
                onChange={() => {}}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium">{portfolio.brokerName}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDisconnect(portfolio.brokerName)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Total Value Card */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-xs text-muted-foreground">Total Combined Value</p>
        <p className="text-2xl font-bold text-foreground">
          {brokerType === 'us' ? '$' : '₹'}
          {totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {combinedHoldings.length} unique holdings across {selectedBrokers.size} broker
          {selectedBrokers.size !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Combined Holdings Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Symbol</th>
              <th className="px-4 py-3 text-right font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 text-right font-semibold">Value</th>
              <th className="px-4 py-3 text-left font-semibold">Brokers</th>
            </tr>
          </thead>
          <tbody>
            {combinedHoldings.map((holding) => (
              <tr key={holding.symbol} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{holding.symbol}</td>
                <td className="px-4 py-3 text-right">{holding.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {brokerType === 'us' ? '$' : '₹'}
                  {holding.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {brokerType === 'us' ? '$' : '₹'}
                  {holding.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {holding.brokers.map((broker) => (
                      <span
                        key={broker}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {broker}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Broker Details */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Broker Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {portfolios
            .filter((p) => selectedBrokers.has(p.brokerName))
            .map((portfolio) => (
              <div
                key={portfolio.brokerName}
                className="rounded-lg border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{portfolio.brokerName}</h4>
                  <span className="text-xs text-muted-foreground">
                    {portfolio.holdings.length} holdings
                  </span>
                </div>
                <p className="text-lg font-bold">
                  {portfolio.currency}
                  {portfolio.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated: {portfolio.lastUpdated.toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
