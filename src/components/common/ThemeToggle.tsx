import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useT } from '@/i18n'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const t = useT()
  return (
    <button
      onClick={toggle}
      aria-label={t.common.toggleTheme}
      className={`rounded-lg p-2 text-muted-foreground hover:bg-muted ${className ?? ''}`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
