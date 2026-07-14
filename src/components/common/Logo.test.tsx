import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrandProvider } from '@/branding'
import { ThemeProvider } from '@/lib/theme'
import { Logo } from './Logo'

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('Logo', () => {
  it('uses a transparent text fallback in light mode when the legacy PNG is opaque', () => {
    localStorage.setItem('gf-theme', 'light')
    const { container } = render(<ThemeProvider><Logo /></ThemeProvider>)

    expect(screen.getByText('Clikarage')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
    expect(container.querySelector('[data-logo-variant="light-fallback"]')).toHaveClass('bg-transparent')
    expect(container.querySelector('[data-logo-variant="light-fallback"]')).not.toHaveClass('bg-white')
  })

  it('uses a transparent text fallback in dark mode when no approved dark asset exists', () => {
    localStorage.setItem('gf-theme', 'dark')
    const { container } = render(<ThemeProvider><Logo /></ThemeProvider>)

    expect(screen.getByText('Clikarage')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
    expect(container.querySelector('[data-logo-variant="dark-fallback"]')).toHaveClass('bg-transparent')
    expect(container.querySelector('[data-logo-variant="dark-fallback"]')).not.toHaveClass('bg-white')
  })

  it('keeps the compact fallback within its content instead of stretching an unavailable icon', () => {
    localStorage.setItem('gf-theme', 'dark')
    const { container } = render(<ThemeProvider><Logo compact /></ThemeProvider>)

    expect(container.querySelector('[data-logo-variant="dark-fallback"]')).toHaveClass('text-sm')
    expect(container.querySelector('img')).toBeNull()
  })

  it('keeps the Speedy placeholder isolated from Clikarage in both themes', () => {
    localStorage.setItem('gf-brand', 'speedy')
    localStorage.setItem('gf-theme', 'dark')
    render(<ThemeProvider><BrandProvider><Logo /></BrandProvider></ThemeProvider>)

    expect(screen.getByText('Speedy')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
    expect(screen.queryByText('Clikarage')).toBeNull()
  })
})
