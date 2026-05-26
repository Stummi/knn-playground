<script lang="ts">
  import { onMount } from 'svelte'
  import { store } from './lib/store.svelte'
  import { initModel, embed } from './lib/embeddings'

  const SEED_PHRASES = [
    'I love puppies and dogs',
    'Chilly winter nights',
    'Golden retriever puppies',
    'Hot summer afternoon',
  ]

  let inputValue = $state('')

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || store.isEmbedding) return

    store.setEmbedding()
    const embedding = await embed(text)
    store.addPhrase(text, embedding)
    inputValue = ''
    store.setReady()
  }

  onMount(async () => {
    try {
      await initModel()
      store.setReady()
      for (const phrase of SEED_PHRASES) {
        const embedding = await embed(phrase)
        store.addPhrase(phrase, embedding)
      }
    } catch (err) {
      store.setError(`Error loading model: ${(err as Error).message}`)
    }
  })
</script>

<div class="bg-gray-50 text-gray-800 p-6 max-w-4xl mx-auto">
  <header class="mb-8">
    <h1 class="text-3xl font-bold mb-2">🧠 In-Browser Embedding Explorer</h1>
    <p class="text-gray-600">
      Enter phrases to generate AI embeddings locally. Click a phrase to compute real-time vector distances!
    </p>
    <div class={store.statusClass}>{store.statusText}</div>
  </header>

  <main class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-1 bg-white p-4 rounded-xl shadow-xs border border-gray-200 h-fit">
      <h2 class="text-xl font-semibold mb-3">Add Phrases</h2>
      <form onsubmit={handleSubmit} class="space-y-3">
        <input
          type="text"
          bind:value={inputValue}
          disabled={!store.isReady || store.isEmbedding}
          placeholder="Type a word or sentence..."
          class="w-full p-2 border border-gray-300 rounded focus:outline-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!store.isReady || store.isEmbedding}
          class="w-full bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          Add & Embed
        </button>
      </form>
      <div class="mt-4 text-xs text-gray-400">Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)</div>
    </div>

    <div class="md:col-span-2 bg-white p-4 rounded-xl shadow-xs border border-gray-200">
      <h2 class="text-xl font-semibold mb-3">Your Vector Space</h2>
      <p class="text-xs text-gray-500 mb-4">
        Click a phrase to see which items are closest (1.000 is identical) or furthest away.
      </p>

      <div class="space-y-2">
        {#if store.phrases.length === 0}
          <p class="text-gray-400 text-center py-4">No phrases added yet.</p>
        {:else}
          {#each store.scoredPhrases as item (item.originalIndex)}
            {@const isTarget = item.originalIndex === store.selectedIndex}
            <div
              role="button"
              tabindex="0"
              class="p-3 rounded-lg border border-gray-200 flex justify-between items-center cursor-pointer transition hover:bg-gray-50 {isTarget ? 'selected' : ''}"
              onclick={() => store.toggleSelect(item.originalIndex)}
              onkeydown={(e) => e.key === 'Enter' && store.toggleSelect(item.originalIndex)}
            >
              <span class="font-medium">{item.text}</span>
              {#if isTarget}
                <span class="text-xs px-2 py-1 rounded bg-blue-600 text-white font-bold">🎯 Target</span>
              {:else if item.score !== null}
                {@const badgeClass =
                  item.score > 0.7
                    ? 'bg-green-100 text-green-800 font-bold'
                    : item.score < 0.3
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700'}
                <span class="text-xs px-2 py-1 rounded {badgeClass}">
                  Match: {item.score.toFixed(3)}
                </span>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </main>
</div>
