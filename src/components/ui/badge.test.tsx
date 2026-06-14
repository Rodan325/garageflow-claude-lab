import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, StatusPill } from './badge'

describe('Badge & StatusPill', () => {
  it('renders badge children', () => {
    render(<Badge tone="success">Connecté</Badge>)
    expect(screen.getByText('Connecté')).toBeInTheDocument()
  })

  it('renders a status pill with its label', () => {
    render(<StatusPill tone="warning" label="En attente" />)
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })
})
