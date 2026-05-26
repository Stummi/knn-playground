import { pipeline } from '@xenova/transformers'
import type { Phrase } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null

export const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const AVAILABLE_MODELS = [
  { id: 'Xenova/all-MiniLM-L6-v2', label: 'MiniLM-L6 (384d, ~30MB)' },
  { id: 'Xenova/all-MiniLM-L12-v2', label: 'MiniLM-L12 (384d, ~60MB)' },
  { id: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', label: 'Multilingual MiniLM (384d, ~120MB)' },
]

export async function initModel(modelId = DEFAULT_MODEL): Promise<void> {
  extractor = await pipeline('feature-extraction', modelId)
}

export async function embed(text: string): Promise<number[]> {
  if (!extractor) throw new Error('Model not initialized')
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export async function reembedAll(phrases: Phrase[]): Promise<Phrase[]> {
  return Promise.all(
    phrases.map(async (p) => ({ text: p.text, embedding: await embed(p.text) }))
  )
}
