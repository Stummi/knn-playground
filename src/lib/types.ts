export interface Phrase {
  text: string
  embedding: number[]
}

export interface ScoredPhrase extends Phrase {
  originalIndex: number
  score: number | null
}

export interface AnalogyResult extends Phrase {
  originalIndex: number
  score: number
  role: 'A' | 'B' | 'X' | null
}

export type StatusType = 'loading' | 'ready' | 'embedding' | 'error'
