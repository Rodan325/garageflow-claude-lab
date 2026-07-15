import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, isDemo } from '@/lib/demo'
import { attachmentsEnabled } from '@/lib/features'
import { supabase } from '@/lib/supabase'
import {
  safeAttachmentName,
  validateAttachment,
  type AttachmentDocumentType,
  type AttachmentVisibility,
  type ServiceRequestAttachment,
} from '@/features/attachments/model'

const BUCKET = 'service-request-attachments'

export function useAttachments(requestId?: string, customerView = false) {
  return useQuery({
    queryKey: ['attachments', requestId, customerView],
    enabled: !!requestId && attachmentsEnabled(),
    queryFn: async (): Promise<ServiceRequestAttachment[]> => {
      if (isDemo()) return demo.attachments(requestId!, customerView)
      let query = supabase
        .from('service_request_attachments')
        .select('*')
        .eq('service_request_id', requestId!)
        .order('created_at', { ascending: false })
      if (customerView) query = query.in('visibility', ['customer', 'both'])
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ServiceRequestAttachment[]
    },
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      garageId: string
      requestId: string
      recommendationId?: string | null
      file: File
      currentCount: number
      visibility: AttachmentVisibility
      documentType: AttachmentDocumentType
    }): Promise<ServiceRequestAttachment> => {
      if (!attachmentsEnabled()) throw new Error('Attachments are disabled')
      const validationError = validateAttachment(input.file, input.currentCount)
      if (validationError) throw new Error(validationError)
      const fileName = safeAttachmentName(input.file.name)
      if (isDemo()) {
        return demo.addAttachment({
          requestId: input.requestId, recommendationId: input.recommendationId,
          fileName, mimeType: input.file.type, fileSize: input.file.size,
          visibility: input.visibility, documentType: input.documentType,
        })
      }

      const objectId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const storagePath = `${input.garageId}/${input.requestId}/${objectId}-${fileName}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, input.file, {
        contentType: input.file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data, error } = await supabase.rpc('register_service_request_attachment', {
        p_request_id: input.requestId,
        p_recommendation_id: input.recommendationId ?? null,
        p_file_name: fileName,
        p_mime_type: input.file.type,
        p_file_size: input.file.size,
        p_storage_path: storagePath,
        p_visibility: input.visibility,
        p_document_type: input.documentType,
      })
      if (error) {
        await supabase.storage.from(BUCKET).remove([storagePath])
        throw error
      }
      return data as ServiceRequestAttachment
    },
    onSuccess: (attachment) => queryClient.invalidateQueries({ queryKey: ['attachments', attachment.service_request_id] }),
  })
}

export async function createAttachmentDownloadUrl(attachment: ServiceRequestAttachment) {
  if (attachment.storage_path.startsWith('demo://')) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(attachment.storage_path, 60)
  if (error) throw error
  return data.signedUrl
}
