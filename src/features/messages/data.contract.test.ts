import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const requestsData = readFileSync(join(process.cwd(), 'src/data/requests.ts'), 'utf8')
const clientPage = readFileSync(
  join(process.cwd(), 'src/features/client/ClientBookingDetailPage.tsx'),
  'utf8',
)
const garagePage = readFileSync(
  join(process.cwd(), 'src/features/pro/BookingsPage.tsx'),
  'utf8',
)

describe('service request message frontend contract', () => {
  it('creates persisted messages only through the secured RPC', () => {
    expect(requestsData).toContain(".rpc('post_service_request_message'")
    expect(requestsData).toContain('p_request_id: input.requestId')
    expect(requestsData).toContain('p_body: input.body')
    expect(requestsData).not.toMatch(
      /\.from\('service_request_messages'\)\s*\.insert\(/,
    )
  })

  it.each([
    ['client', clientPage],
    ['garage', garagePage],
  ])('%s UI sends only request id and body', (_surface, source) => {
    expect(source).toMatch(/addMessage\.mutateAsync\(\{\s*requestId:[^,]+,\s*body:/)
    expect(source).not.toMatch(/addMessage\.mutateAsync\(\{[\s\S]{0,250}\b(garageId|sender|authorId|createdAt|id):/)
  })

  it.each([
    ['client', clientPage],
    ['garage', garagePage],
  ])('%s UI fails closed for read-only conversations', (_surface, source) => {
    expect(source).toContain('isRequestConversationWritable')
    expect(source).toContain('Cette conversation est en lecture seule.')
    expect(source).toContain('Message non envoyé')
  })
})
