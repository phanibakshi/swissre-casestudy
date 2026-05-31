export type DocumentComment = {
  id: string
  page: number
  author: string
  text: string
  createdAt: string
}

export type DocumentAnnotation = {
  id: string
  page: number
  type: 'highlight' | 'note'
  x: number
  y: number
  width: number
  height: number
  color: string
  text?: string
}

export type DocumentJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export type DocumentJob = {
  id: string
  type: 'delete' | 'split' | 'merge' | 'rotate'
  status: DocumentJobStatus
  message: string
  createdAt: string
}

export type DocumentState = {
  version: number
  deletedPages: number[]
  rotations: Record<number, number>
}
