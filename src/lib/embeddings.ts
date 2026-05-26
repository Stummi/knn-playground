import { pipeline } from '@huggingface/transformers'
import type { Phrase } from './types'

export interface ModelConfig {
  id: string
  label: string
  dims: number
  size: string
  prefix?: string
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { id: 'Xenova/all-MiniLM-L6-v2',                       label: 'MiniLM-L6',      dims: 384, size: '~23 MB' },
  { id: 'Xenova/bge-small-en-v1.5',                       label: 'BGE Small',      dims: 384, size: '~24 MB', prefix: 'query: ' },
  { id: 'Xenova/gte-small',                                label: 'GTE Small',      dims: 384, size: '~35 MB' },
  { id: 'Xenova/all-MiniLM-L12-v2',                       label: 'MiniLM-L12',     dims: 384, size: '~43 MB' },
  { id: 'Xenova/bge-base-en-v1.5',                        label: 'BGE Base',       dims: 768, size: '~109 MB', prefix: 'query: ' },
  { id: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',   label: 'Multilingual',   dims: 384, size: '~118 MB' },
]

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null
let currentPrefix = ''

export async function initModel(modelId = DEFAULT_MODEL): Promise<void> {
  const config = AVAILABLE_MODELS.find(m => m.id === modelId)
  currentPrefix = config?.prefix ?? ''
  extractor = await pipeline('feature-extraction', modelId)
}

export async function embed(text: string): Promise<number[]> {
  if (!extractor) throw new Error('Model not initialized')
  const output = await extractor(currentPrefix + text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export async function reembedAll(phrases: Phrase[]): Promise<Phrase[]> {
  return Promise.all(
    phrases.map(async (p) => ({ text: p.text, embedding: await embed(p.text) }))
  )
}
