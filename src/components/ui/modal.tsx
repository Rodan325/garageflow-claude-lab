import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useLang } from '@/i18n'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** "center" desktop dialog, "sheet" mobile bottom sheet. */
  variant?: 'center' | 'sheet'
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'center',
  className,
}: ModalProps) {
  const { tr } = useLang()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={variant === 'sheet' ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={variant === 'sheet' ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={variant === 'sheet' ? { y: '100%' } : { opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={cn(
              'relative z-10 w-full bg-card text-card-foreground shadow-pop',
              variant === 'sheet'
                ? 'max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:rounded-2xl'
                : 'm-4 max-h-[90dvh] max-w-lg overflow-y-auto rounded-2xl',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="space-y-1">
                {title && <h2 className="text-lg font-semibold">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label={tr('Fermer')}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-border p-5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
