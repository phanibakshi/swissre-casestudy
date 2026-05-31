import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

export const DOCUMENT_PDF_URL = '/documents/sample.pdf'

let cachedTask: ReturnType<typeof getDocument> | null = null
let cachedPromise: Promise<PDFDocumentProxy> | null = null

export function loadPdfDocument(): Promise<PDFDocumentProxy> {
  if (!cachedPromise) {
    cachedTask = getDocument({ url: DOCUMENT_PDF_URL })
    cachedPromise = cachedTask.promise
  }
  return cachedPromise
}

export function releasePdfDocument(): void {
  void cachedTask?.destroy()
  cachedTask = null
  cachedPromise = null
}
