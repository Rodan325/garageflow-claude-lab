import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrandProvider } from '@/branding'
import { Logo } from './Logo'

afterEach(() => localStorage.clear())

describe('Logo', () => {
  it('renders the official Clikarage image and text fallback', () => {
    render(<Logo />)
    const image = screen.getByRole('img', { name: 'Clikarage' })
    expect(image).toHaveAttribute('src', '/branding/clikarage-logo.png')

    fireEvent.error(image)
    expect(screen.getByText('Clikarage')).toBeInTheDocument()
  })

  it('keeps the Speedy placeholder isolated from Clikarage', () => {
    localStorage.setItem('gf-brand', 'speedy')
    render(<BrandProvider><Logo /></BrandProvider>)

    expect(screen.getByText('Speedy')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
  })
})
