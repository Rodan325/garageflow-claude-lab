import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrandProvider, useBrand } from '@/branding'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { Logo } from './Logo'

function ThemeSwitchHarness() {
  const { toggle } = useTheme()
  return (
    <>
      <Logo />
      <button type="button" onClick={toggle}>Toggle theme</button>
    </>
  )
}

function BrandExitHarness() {
  const { exitDemo } = useBrand()
  return (
    <>
      <Logo />
      <button type="button" onClick={exitDemo}>Exit demo</button>
    </>
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('Logo', () => {
  it('renders the light SVG in light mode without a text fallback', () => {
    localStorage.setItem('gf-theme', 'light')
    render(<ThemeProvider><Logo /></ThemeProvider>)

    expect(screen.getByRole('img', { name: 'Clikarage' })).toHaveAttribute(
      'src',
      '/branding/clikarage-logo-light.svg',
    )
    expect(screen.queryByText('Clikarage')).toBeNull()
  })

  it('renders the dark SVG in dark mode', () => {
    localStorage.setItem('gf-theme', 'dark')
    render(<ThemeProvider><Logo /></ThemeProvider>)

    expect(screen.getByRole('img', { name: 'Clikarage' })).toHaveAttribute(
      'src',
      '/branding/clikarage-logo-dark.svg',
    )
  })

  it('renders the compact icon independently of the theme', () => {
    localStorage.setItem('gf-theme', 'light')
    render(<ThemeProvider><Logo compact /></ThemeProvider>)

    const image = screen.getByRole('img', { name: 'Clikarage' })
    expect(image).toHaveAttribute('src', '/branding/clikarage-icon.svg')
    expect(image).toHaveAttribute('width', '32')
    expect(image).toHaveAttribute('height', '32')
  })

  it('renders the text fallback only after an image loading failure', () => {
    localStorage.setItem('gf-theme', 'light')
    render(<ThemeProvider><Logo /></ThemeProvider>)

    fireEvent.error(screen.getByRole('img', { name: 'Clikarage' }))

    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
    expect(screen.getByText('Clikarage')).toBeInTheDocument()
  })

  it('resets a loading failure when the selected URL changes', () => {
    localStorage.setItem('gf-theme', 'light')
    render(<ThemeProvider><ThemeSwitchHarness /></ThemeProvider>)

    fireEvent.error(screen.getByRole('img', { name: 'Clikarage' }))
    expect(screen.getByText('Clikarage')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))

    expect(screen.getByRole('img', { name: 'Clikarage' })).toHaveAttribute(
      'src',
      '/branding/clikarage-logo-dark.svg',
    )
    expect(screen.queryByText('Clikarage')).toBeNull()
  })

  it('keeps the image and its container transparent without hiding the asset', () => {
    localStorage.setItem('gf-theme', 'dark')
    const { container } = render(<ThemeProvider><Logo /></ThemeProvider>)

    const logoContainer = container.querySelector('[data-logo-variant="dark"]')
    const image = screen.getByRole('img', { name: 'Clikarage' })
    expect(logoContainer).toHaveClass('bg-transparent')
    expect(logoContainer).not.toHaveClass('bg-white')
    expect(image).toHaveClass('block', 'object-contain')
    expect(image).not.toHaveClass('hidden', 'opacity-0')
  })

  it('keeps the Speedy placeholder isolated and restores Clikarage on exit', () => {
    localStorage.setItem('gf-brand', 'speedy')
    localStorage.setItem('gf-theme', 'dark')
    render(<ThemeProvider><BrandProvider><BrandExitHarness /></BrandProvider></ThemeProvider>)

    expect(screen.getByText('Speedy')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Clikarage' })).toBeNull()
    expect(screen.queryByText('Clikarage')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Exit demo' }))

    expect(screen.queryByText('Speedy')).toBeNull()
    expect(screen.getByRole('img', { name: 'Clikarage' })).toHaveAttribute(
      'src',
      '/branding/clikarage-logo-dark.svg',
    )
  })
})
