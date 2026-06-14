'use client'

import { useState } from 'react'
import { BROKER_CONFIGS } from '@/lib/brokers/config'
import { initiateBrokerConnection } from '@/app/actions/brokers'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface BrokerSelectorProps {
  brokerType: 'india' | 'us'
  onConnectionInitiated?: (brokerName: string) => void
}

export function BrokerSelector({ brokerType, onConnectionInitiated }: BrokerSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredBrokers = Object.values(BROKER_CONFIGS).filter((b) => b.type === brokerType)

  const handleConnectBroker = async (brokerName: string) => {
    try {
      setLoading(brokerName)
      setError(null)

      const oauthUrl = await initiateBrokerConnection(brokerName)

      // Redirect to broker's OAuth page
      window.location.href = oauthUrl
      onConnectionInitiated?.(brokerName)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect broker'
      setError(message)
      console.error('[v0] Broker connection error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Click on a broker to connect and sync your {brokerType === 'india' ? 'Indian' : 'US'} investments
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredBrokers.map((broker) => (
          <Button
            key={broker.id}
            onClick={() => handleConnectBroker(broker.id)}
            disabled={loading === broker.id}
            variant="outline"
            className="flex h-24 flex-col items-center justify-center gap-2"
          >
            {loading === broker.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="text-2xl">{broker.logo}</span>
                <span className="text-xs font-medium text-center">{broker.name}</span>
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
