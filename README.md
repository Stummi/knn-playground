# Embeddings & KNN Explorer

An in-browser sandbox for exploring AI text embeddings and vector similarity — no server required.

## What it does

- Generates embeddings for arbitrary phrases directly in the browser using [Transformers.js](https://huggingface.co/docs/transformers.js)
- Computes cosine similarity between any two phrases in real time
- Click any phrase to rank all others by vector distance (nearest → furthest)

## Tech

- [Svelte 5](https://svelte.dev) + [Vite](https://vitejs.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) — 384-dimension model, ~30 MB, runs fully client-side via WebAssembly

## Getting started

```bash
npm install
npm run dev
```
