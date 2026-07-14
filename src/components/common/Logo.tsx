import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'
import { useBrand } from '@/branding'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { brand } = useBrand()
  const { theme } = useTheme()
  const [imageFailed, setImageFailed] = useState(false)
  const selectedLogoUrl = compact
    ? brand.logoIconUrl
    : theme === 'dark'
      ? brand.logoDarkUrl
      : brand.logoLightUrl

  useEffect(() => {
    setImageFailed(false)
  }, [selectedLogoUrl])

  if (brand.logoComponent) {
    const BrandLogo = brand.logoComponent
    return <BrandLogo className={className} compact={compact} />
  }

  if (selectedLogoUrl && !imageFailed) {
    return (
      <span
        data-logo-variant={theme}
        className={cn(
          'relative inline-flex shrink-0 items-center overflow-hidden bg-transparent',
          compact ? 'h-8 w-8' : 'h-10 w-32 sm:w-40',
          className,
        )}
      >
        <img
          src={selectedLogoUrl}
          alt="Clikarage"
          width={compact ? 32 : 160}
          height={compact ? 32 : 40}
          onError={() => setImageFailed(true)}
          className="block h-full w-full object-contain object-center"
        />
      </span>
    )
  }

  return (
    <span
      data-logo-variant={`${theme}-fallback`}
      className={cn(
        'inline-flex h-10 shrink-0 items-center bg-transparent font-bold tracking-tight text-foreground',
        compact ? 'text-sm' : 'text-lg sm:text-xl',
        className,
      )}
    >
      Clikarage
    </span>
  )
}
