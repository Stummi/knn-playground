<script lang="ts">
  import { onMount } from 'svelte'
  import { store } from './lib/store.svelte'
  import { initModel, embed, AVAILABLE_MODELS } from './lib/embeddings'
  import ExplorerTab from './ExplorerTab.svelte'
  import AnalogyTab from './AnalogyTab.svelte'

  const currentModel = $derived(
    AVAILABLE_MODELS.find(m => m.id === store.currentModelId) ?? AVAILABLE_MODELS[0]
  )

  const SEED_PHRASES = [
    'I love puppies and dogs',
    'Chilly winter nights',
    'Golden retriever puppies',
    'Hot summer afternoon',
  ]

  const STATUS_LABEL: Record<string, string> = {
    loading:   'LOADING MODEL',
    ready:     'SYSTEM READY',
    embedding: 'VECTORIZING',
    switching: 'SWITCHING MODEL',
    error:     'SYSTEM ERROR',
  }

  type Tab = 'explorer' | 'analogies'
  let activeTab = $state<Tab>('explorer')

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

<div class="shell">

  <!-- ── Header ──────────────────────────────── -->
  <header class="header">
    <div class="header-inner">
      <div class="title-block">
        <h1 class="title">Embedding Explorer</h1>
        <p class="subtitle">in-browser · no server · cosine similarity</p>
      </div>

      <div class="status-block">
        <div class="status-chip" data-type={store.statusType}>
          <span class="status-dot"></span>
          <span class="status-label">{STATUS_LABEL[store.statusType]}</span>
        </div>
        <div class="model-name">{currentModel.id} · {currentModel.dims}d</div>
      </div>
    </div>
    <div class="rule"></div>
  </header>

  <!-- ── Tab nav ─────────────────────────────── -->
  <nav class="tab-nav">
    <button
      class="tab-btn"
      class:active={activeTab === 'explorer'}
      onclick={() => activeTab = 'explorer'}
    >
      EXPLORER
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'analogies'}
      onclick={() => activeTab = 'analogies'}
    >
      ANALOGIES
    </button>
  </nav>

  <!-- ── Tab content (both mounted; inactive hidden) ── -->
  <div class="tab-content" class:tab-hidden={activeTab !== 'explorer'}>
    <ExplorerTab />
  </div>
  <div class="tab-content" class:tab-hidden={activeTab !== 'analogies'}>
    <AnalogyTab />
  </div>

</div>

<style>
  /* ── Shell ───────────────────────────────────── */
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg);
  }

  /* ── Header ──────────────────────────────────── */
  .header { padding: 2rem 2.5rem 0; }

  .header-inner {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .title {
    font-family: 'Bebas Neue', 'Arial Black', sans-serif;
    font-size: clamp(3.5rem, 8vw, 6rem);
    font-weight: 400;
    line-height: 0.86;
    letter-spacing: 0.03em;
    color: var(--text);
    text-transform: uppercase;
    margin-bottom: 0.8rem;
  }

  .subtitle {
    font-size: 0.65rem;
    color: var(--text-dim);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .status-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    padding-bottom: 0.15rem;
  }

  .status-chip {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-dim);
    flex-shrink: 0;
    transition: background 0.3s, box-shadow 0.3s;
  }

  .status-label {
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    color: var(--text-dim);
    transition: color 0.3s;
  }

  .status-chip[data-type="loading"]   .status-dot,
  .status-chip[data-type="ready"]     .status-dot   { background: var(--green); }
  .status-chip[data-type="embedding"] .status-dot    { background: var(--amber); }
  .status-chip[data-type="error"]     .status-dot    { background: var(--red); }

  .status-chip[data-type="ready"] .status-dot {
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  }

  .status-chip[data-type="loading"]   .status-dot,
  .status-chip[data-type="embedding"] .status-dot,
  .status-chip[data-type="switching"] .status-dot {
    animation: blink 0.9s ease-in-out infinite;
  }

  .status-chip[data-type="switching"] .status-dot { background: var(--amber); }

  .status-chip[data-type="loading"]   .status-label { color: var(--green); }
  .status-chip[data-type="ready"]     .status-label { color: var(--green); }
  .status-chip[data-type="embedding"] .status-label { color: var(--amber); }
  .status-chip[data-type="switching"] .status-label { color: var(--amber); }
  .status-chip[data-type="error"]     .status-label { color: var(--red); }

  .model-name { font-size: 0.58rem; color: var(--text-dim); opacity: 0.5; letter-spacing: 0.06em; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }

  .rule {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border) 8%, var(--border) 92%, transparent);
  }

  /* ── Tab nav ─────────────────────────────────── */
  .tab-nav {
    display: flex;
    border-bottom: 1px solid var(--border);
    padding: 0 2.5rem;
  }

  .tab-btn {
    background: none;
    border: none;
    border-bottom: 1px solid transparent;
    margin-bottom: -1px;
    padding: 0.7rem 1.25rem 0.65rem;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.16em;
    color: var(--text-dim);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }

  .tab-btn:hover { color: var(--text-muted); }

  .tab-btn.active {
    color: var(--green);
    border-bottom-color: var(--green);
  }

  /* ── Tab content ─────────────────────────────── */
  .tab-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .tab-hidden { display: none; }

  /* ── Responsive ──────────────────────────────── */
  @media (max-width: 600px) {
    .header         { padding: 1.5rem 1.25rem 0; }
    .header-inner   { flex-direction: column; align-items: flex-start; }
    .status-block   { align-items: flex-start; }
    .title          { font-size: 3.5rem; }
    .tab-nav        { padding: 0 1.25rem; }
  }
</style>
