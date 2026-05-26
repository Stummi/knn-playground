export interface Phrase {
  text: string
  embedding: number[]
}

export interface ScoredPhrase extends Phrase {
  originalIndex: number
  score: number | null
}

export type StatusType = 'loading' | 'ready' | 'embedding' | 'error'
