import { useRef, useState } from 'react'
import { Download, FileImage, FileText, Film, Paperclip, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { createAttachmentDownloadUrl, useAttachments, useUploadAttachment } from '@/data/attachments'
import { useLang, LOCALES } from '@/i18n'
import type { AttachmentDocumentType, AttachmentVisibility, ServiceRequestAttachment } from './model'

const documentLabels = {
  fr: { photo: 'Photo', video: 'Vidéo', diagnostic: 'Diagnostic', quote: 'Devis', invoice: 'Facture', report: 'Rapport', other: 'Document' },
  en: { photo: 'Photo', video: 'Video', diagnostic: 'Diagnostic', quote: 'Quote', invoice: 'Invoice', report: 'Report', other: 'Document' },
  ar: { photo: 'صورة', video: 'فيديو', diagnostic: 'تشخيص', quote: 'عرض سعر', invoice: 'فاتورة', report: 'تقرير', other: 'مستند' },
} as const

export function AttachmentsPanel({
  garageId,
  requestId,
  recommendationId,
  customerView = false,
}: {
  garageId: string
  requestId: string
  recommendationId?: string | null
  customerView?: boolean
}) {
  const { lang, tr } = useLang()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [visibility, setVisibility] = useState<AttachmentVisibility>('both')
  const { data: attachments } = useAttachments(requestId, customerView)
  const upload = useUploadAttachment()

  async function selectFile(file?: File) {
    if (!file) return
    const documentType: AttachmentDocumentType = file.type.startsWith('image/')
      ? 'photo'
      : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'diagnostic' : 'other'
    try {
      await upload.mutateAsync({
        garageId, requestId, recommendationId, file, currentCount: attachments?.length ?? 0,
        visibility, documentType,
      })
      toast.success(tr('Pièce jointe ajoutée'))
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      if (code === 'unsupported_type') toast.error(tr('Format de fichier non autorisé'))
      else if (code === 'invalid_size') toast.error(tr('Le fichier dépasse la taille autorisée de 25 Mo.'))
      else if (code === 'limit_reached') toast.error(tr('La limite de 20 fichiers est atteinte.'))
      else toast.error(tr('Ajout impossible'), tr('La pièce jointe n’a pas pu être enregistrée.'))
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function download(attachment: ServiceRequestAttachment) {
    try {
      const url = await createAttachmentDownloadUrl(attachment)
      if (!url) {
        toast.info(tr('Aperçu simulé'), tr('Aucun fichier externe n’est ouvert dans le compte de démonstration.'))
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error(tr('Téléchargement impossible'))
    }
  }

  return (
    <Card className="mt-4 p-4" data-testid="attachments-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Paperclip className="h-4 w-4" /> {tr('Pièces jointes')}</h2>
          <p className="text-xs text-muted-foreground">{tr('Photos, diagnostics et documents liés à ce dossier.')}</p>
        </div>
        {!customerView && (
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label={tr('Visibilité')} value={visibility} onChange={(event) => setVisibility(event.target.value as AttachmentVisibility)} className="h-9 w-auto">
              <option value="internal">{tr('Interne')}</option>
              <option value="customer">{tr('Client')}</option>
              <option value="both">{tr('Interne et client')}</option>
            </Select>
            <input ref={fileInput} type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.txt,.csv" onChange={(event) => selectFile(event.target.files?.[0])} />
            <Button size="sm" loading={upload.isPending} onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" /> {tr('Ajouter un fichier')}</Button>
          </div>
        )}
      </div>
      {!attachments?.length ? (
        <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{tr('Aucune pièce jointe visible.')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {attachments.map((attachment) => {
            const Icon = attachment.document_type === 'photo' ? FileImage : attachment.document_type === 'video' ? Film : FileText
            return (
              <li key={attachment.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" dir="auto">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {documentLabels[lang][attachment.document_type]} · {new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 1 }).format(attachment.file_size / 1024)} Ko
                  </p>
                </div>
                {!customerView && <Badge>{attachment.visibility === 'both' ? tr('Interne et client') : attachment.visibility === 'customer' ? tr('Client') : tr('Interne')}</Badge>}
                <Button variant="ghost" size="icon" onClick={() => download(attachment)} aria-label={tr('Télécharger')}><Download className="h-4 w-4" /></Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
