import type { Phrase, StatusType } from './types'
import { cosineSimilarity } from './math'
import type { ScoredPhrase } from './types'
import { DEFAULT_MODEL } from './embeddings'

class EmbeddingStore {
  phrases       = $state<Phrase[]>([])
  selectedIndex = $state<number | null>(null)
  statusType    = $state<StatusType>('loading')
  isReady       = $state(false)
  isEmbedding   = $state(false)
  isSwitching   = $state(false)
  currentModelId = $state(DEFAULT_MODEL)
  switchProgress = $state<{ done: number; total: number } | null>(null)

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

  deletePhrase(index: number) {
    this.phrases = this.phrases.filter((_, i) => i !== index)
    if (this.selectedIndex === index) {
      this.selectedIndex = null
    } else if (this.selectedIndex !== null && this.selectedIndex > index) {
      this.selectedIndex--
    }
  }

  setReady() {
    this.statusType  = 'ready'
    this.isReady     = true
    this.isEmbedding = false
    this.isSwitching = false
  }

  setEmbedding() {
    this.statusType  = 'embedding'
    this.isEmbedding = true
  }

  beginSwitch(total: number) {
    this.statusType    = 'switching'
    this.isSwitching   = true
    this.switchProgress = { done: 0, total }
  }

  tickSwitch(done: number) {
    this.switchProgress = { done, total: this.switchProgress!.total }
  }

  finishSwitch(modelId: string, phrases: Phrase[]) {
    this.currentModelId = modelId
    this.phrases        = phrases
    this.selectedIndex  = null
    this.switchProgress = null
    this.setReady()
  }

  setError(message: string) {
    this.statusType  = 'error'
    this.isReady     = false
    this.isEmbedding = false
    this.isSwitching = false
    this.switchProgress = null
    console.error(message)
  }
}

export const store = new EmbeddingStore()
