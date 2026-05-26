import type { Phrase, StatusType } from './types'
import { cosineSimilarity } from './math'
import type { ScoredPhrase } from './types'

class EmbeddingStore {
  phrases = $state<Phrase[]>([])
  selectedIndex = $state<number | null>(null)
  statusText = $state('🤖 Loading AI Model (approx. 30MB)... please wait.')
  statusType = $state<StatusType>('loading')
  isReady = $state(false)
  isEmbedding = $state(false)

  get scoredPhrases(): ScoredPhrase[] {
    const items = this.phrases.map((item, index) => ({
      ...item,
      originalIndex: index,
      score:
        this.selectedIndex !== null
          ? cosineSimilarity(this.phrases[this.selectedIndex].embedding, item.embedding)
          : null,
    }))

    if (this.selectedIndex !== null) {
      items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }

    return items
  }

  get statusClass(): string {
    const base = 'mt-4 p-3 rounded font-medium'
    switch (this.statusType) {
      case 'loading': return `${base} bg-blue-100 text-blue-800`
      case 'ready': return `${base} bg-green-100 text-green-800`
      case 'embedding': return `${base} bg-yellow-100 text-yellow-800`
      case 'error': return `${base} bg-red-100 text-red-800`
    }
  }

  addPhrase(text: string, embedding: number[]) {
    this.phrases = [...this.phrases, { text, embedding }]
  }

  setPhrases(phrases: Phrase[]) {
    this.phrases = phrases
    this.selectedIndex = null
  }

  toggleSelect(index: number) {
    this.selectedIndex = this.selectedIndex === index ? null : index
  }

  setReady() {
    this.statusText = '✅ AI Model ready! Try adding some phrases.'
    this.statusType = 'ready'
    this.isReady = true
    this.isEmbedding = false
  }

  setEmbedding() {
    this.statusText = '⏳ Vectorizing text...'
    this.statusType = 'embedding'
    this.isEmbedding = true
  }

  setError(message: string) {
    this.statusText = `❌ ${message}`
    this.statusType = 'error'
    this.isReady = false
    this.isEmbedding = false
  }
}

export const store = new EmbeddingStore()
