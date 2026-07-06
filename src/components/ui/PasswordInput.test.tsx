import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('starts masked and toggles visibility via the eye button', () => {
    const { container } = render(<PasswordInput placeholder="mot de passe" />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(input.type).toBe('text')

    fireEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }))
    expect(input.type).toBe('password')
  })
})
