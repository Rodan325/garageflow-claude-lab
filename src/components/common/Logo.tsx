import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useBrand } from '@/branding'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { brand } = useBrand()
  const [imageFailed, setImageFailed] = useState(false)

  // White-label components always win, so Speedy's placeholder never receives
  // the official Clikarage image.
  if (brand.logoComponent) {
    const BrandLogo = brand.logoComponent
    return <BrandLogo className={className} compact={compact} />
  }

  // `logoIconUrl` is intentionally optional until an authorized compact asset
  // exists. Small layouts keep a cropped, responsive wordmark in the meantime.
  const imageSrc = compact ? (brand.logoIconUrl ?? brand.logoUrl) : brand.logoUrl
  if (imageSrc && !imageFailed) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-md bg-white',
          compact ? 'h-8 w-24' : 'h-10 w-28 sm:w-40',
          className,
        )}
      >
        <img
          src={imageSrc}
          alt={brand.appName}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover object-center"
        />
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center font-bold tracking-tight', compact ? 'text-sm' : 'text-lg', className)}>
      {brand.appName}
    </span>
  )
}
