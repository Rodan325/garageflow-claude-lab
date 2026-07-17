import { describe, expect, it } from 'vitest'
import { DemoNotificationProvider, UnconfiguredNotificationProvider } from './model'

describe('notification providers', () => {
  it('simulates a notification without calling an external API', async () => {
    const provider = new DemoNotificationProvider('email')
    await expect(provider.send({ recipient: 'demo@example.test', templateKey: 'vehicle_ready', language: 'fr', payload: {} }))
      .resolves.toEqual({ providerMessageId: 'simulated-vehicle_ready-email' })
  })

  it('fails explicitly when a real provider is not connected', async () => {
    const provider = new UnconfiguredNotificationProvider('sms')
    await expect(provider.send({ recipient: '+33000000000', templateKey: 'vehicle_ready', language: 'fr', payload: {} }))
      .rejects.toThrow('No sms notification provider is configured')
  })
})
