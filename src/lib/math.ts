export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function vectorAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i])
}

export function vectorSubtract(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i])
}

export function vectorNormalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
  return v.map(x => x / norm)
}
