<script lang="ts">
  import { store } from './lib/store.svelte'
  import { embed } from './lib/embeddings'

  let inputValue = $state('')
  let inputEl: HTMLInputElement | null = null

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || store.isEmbedding) return
    store.setEmbedding()
    const embedding = await embed(text)
    store.addPhrase(text, embedding)
    inputValue = ''
    store.setReady()
    inputEl?.focus()
  }

  function scoreCategory(score: number): 'high' | 'mid' | 'low' {
    if (score >= 0.65) return 'high'
    if (score >= 0.35) return 'mid'
    return 'low'
  }
</script>

<div class="explorer-body">
  <!-- ── Left: input ────────────────────────── -->
  <aside class="panel panel-left">
    <div class="panel-header">
      <span class="panel-tag">INPUT</span>
    </div>

    <div class="panel-body">
      <form class="input-form" onsubmit={handleSubmit}>
        <div class="field-wrap">
          <span class="prompt">›</span>
          <input
            type="text"
            bind:value={inputValue}
            bind:this={inputEl}
            disabled={!store.isReady || store.isEmbedding}
            placeholder="enter a phrase..."
            class="text-input"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <button
          type="submit"
          class="embed-btn"
          disabled={!store.isReady || store.isEmbedding || !inputValue.trim()}
        >
          {#if store.isEmbedding}
            <span class="spinner"></span> COMPUTING
          {:else}
            EMBED ▶
          {/if}
        </button>
      </form>

      {#if store.phrases.length > 0}
        <div class="stats">
          <div class="stat">
            <span class="stat-n">{store.phrases.length}</span>
            <span class="stat-l">VECTORS</span>
          </div>
          {#if store.selectedIndex !== null && store.scoredPhrases.length > 1}
            <div class="stat">
              <span class="stat-n">{(store.scoredPhrases[1]?.score ?? 0).toFixed(3)}</span>
              <span class="stat-l">BEST MATCH</span>
            </div>
            <div class="stat">
              <span class="stat-n">{(store.scoredPhrases[store.scoredPhrases.length - 1]?.score ?? 0).toFixed(3)}</span>
              <span class="stat-l">WORST</span>
            </div>
          {/if}
        </div>
      {/if}

      <p class="hint">Click any phrase to rank the vector space by cosine similarity.</p>
    </div>
  </aside>

  <!-- ── Right: vector space ────────────────── -->
  <section class="panel panel-right">
    <div class="panel-header">
      <span class="panel-tag">VECTOR SPACE</span>
      {#if store.selectedIndex !== null}
        <span class="panel-sub">↑ similarity ranked</span>
      {:else}
        <span class="panel-sub">{store.phrases.length} phrase{store.phrases.length !== 1 ? 's' : ''}</span>
      {/if}
    </div>

    <div class="phrase-list">
      {#if store.phrases.length === 0}
        <div class="empty">
          <span class="empty-glyph">∅</span>
          <span class="empty-msg">no vectors in space</span>
        </div>
      {:else}
        {#each store.scoredPhrases as item, i (item.originalIndex)}
          {@const isTarget = item.originalIndex === store.selectedIndex}
          {@const cat = item.score !== null && !isTarget ? scoreCategory(item.score) : null}
          <div
            role="button"
            tabindex="0"
            class="phrase-item"
            class:is-target={isTarget}
            class:cat-high={cat === 'high'}
            class:cat-mid={cat === 'mid'}
            class:cat-low={cat === 'low'}
            onclick={() => store.toggleSelect(item.originalIndex)}
            onkeydown={(e) => e.key === 'Enter' && store.toggleSelect(item.originalIndex)}
          >
            <div class="item-row">
              <span class="item-idx">{String(i + 1).padStart(2, '0')}</span>
              <span class="item-text">{item.text}</span>
              <span class="item-score">
                {#if isTarget}
                  <span class="target-pip">◆ TARGET</span>
                {:else if item.score !== null}
                  {item.score.toFixed(3)}
                {/if}
              </span>
            </div>
            {#if item.score !== null && !isTarget}
              <div class="score-track">
                <div class="score-fill" style="width: {item.score * 100}%"></div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </section>
</div>

<style>
  .explorer-body {
    display: grid;
    grid-template-columns: 280px 1fr;
    flex: 1;
    min-height: 0;
  }

  /* ── Panels ──────────────────────────────── */
  .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel-left { border-right: 1px solid var(--border); }

  .panel-right {
    background-image: radial-gradient(
      circle,
      rgba(39, 64, 48, 0.4) 1px,
      transparent 1px
    );
    background-size: 22px 22px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .panel-tag {
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    color: var(--text-muted);
    font-weight: 500;
  }

  .panel-sub {
    font-size: 0.57rem;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }

  .panel-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    flex: 1;
  }

  /* ── Input form ──────────────────────────── */
  .input-form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .field-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .field-wrap:focus-within {
    border-color: var(--green-ring);
    box-shadow: 0 0 0 1px var(--green-glow);
  }

  .prompt {
    color: var(--green);
    font-size: 1.1rem;
    line-height: 1;
    flex-shrink: 0;
    margin-top: -2px;
    opacity: 0.7;
  }

  .text-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.8rem;
    caret-color: var(--green);
    min-width: 0;
  }

  .text-input::placeholder { color: var(--text-dim); opacity: 0.6; }
  .text-input:disabled     { opacity: 0.3; cursor: not-allowed; }

  .embed-btn {
    background: var(--surface-up);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    padding: 0.6rem;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .embed-btn:not(:disabled):hover {
    background: var(--surface-hover);
    border-color: var(--green-ring);
    color: var(--green);
  }

  .embed-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .spinner {
    width: 8px;
    height: 8px;
    border: 1px solid var(--text-dim);
    border-top-color: var(--amber);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Stats ───────────────────────────────── */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
  }

  .stat {
    background: var(--surface);
    padding: 0.6rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .stat-n {
    font-size: 1rem;
    color: var(--text);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .stat-l {
    font-size: 0.5rem;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .hint {
    font-size: 0.6rem;
    color: var(--text-dim);
    line-height: 1.7;
    margin-top: auto;
  }

  /* ── Phrase list ─────────────────────────── */
  .phrase-list {
    flex: 1;
    overflow-y: auto;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 180px;
    color: var(--text-dim);
  }

  .empty-glyph  { font-size: 2.2rem; line-height: 1; opacity: 0.5; }
  .empty-msg    { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.6; }

  /* ── Phrase items ────────────────────────── */
  .phrase-item {
    padding: 0.85rem 1.5rem;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.12s;
    outline: none;
  }

  .phrase-item:hover          { background: rgba(15, 22, 16, 0.7); }
  .phrase-item:focus-visible  { outline: 1px solid var(--green-ring); outline-offset: -1px; }

  .phrase-item.is-target       { background: var(--amber-glow); border-bottom-color: rgba(232,197,71,.18); }
  .phrase-item.is-target:hover { background: rgba(232,197,71,.13); }

  .item-row {
    display: flex;
    align-items: baseline;
    gap: 0.65rem;
  }

  .item-idx  { font-size: 0.52rem; color: var(--text-dim); flex-shrink: 0; letter-spacing: 0.04em; opacity: 0.6; }
  .item-text { flex: 1; font-size: 0.825rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

  .is-target .item-text { color: var(--amber); }

  .item-score {
    flex-shrink: 0;
    font-size: 0.825rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .cat-high .item-score { color: var(--green); }
  .cat-mid  .item-score { color: var(--text-muted); }
  .cat-low  .item-score { color: var(--red); }

  .target-pip {
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    color: var(--amber);
    border: 1px solid var(--amber-ring);
    padding: 0.18em 0.5em;
    background: var(--amber-glow);
  }

  /* ── Score bar ───────────────────────────── */
  .score-track {
    height: 2px;
    background: var(--border);
    margin-top: 0.55rem;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    min-width: 2px;
    transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cat-high .score-fill { background: var(--green); }
  .cat-mid  .score-fill { background: var(--text-muted); }
  .cat-low  .score-fill { background: var(--red); }

  /* ── Responsive ──────────────────────────── */
  @media (max-width: 600px) {
    .explorer-body { grid-template-columns: 1fr; }
    .panel-left    { border-right: none; border-bottom: 1px solid var(--border); }
  }
</style>
