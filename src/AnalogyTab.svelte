<script lang="ts">
  import { store } from './lib/store.svelte'
  import { cosineSimilarity, vectorAdd, vectorSubtract, vectorNormalize } from './lib/math'
  import type { AnalogyResult } from './lib/types'

  let selA = $state<number | null>(null)
  let selB = $state<number | null>(null)
  let selX = $state<number | null>(null)

  // Clear selections that point past the end of the phrase list after a deletion
  $effect(() => {
    const len = store.phrases.length
    if (selA !== null && selA >= len) selA = null
    if (selB !== null && selB >= len) selB = null
    if (selX !== null && selX >= len) selX = null
  })

  const results = $derived.by((): AnalogyResult[] => {
    if (selA === null || selB === null || selX === null) return []
    const pA = store.phrases[selA]
    const pB = store.phrases[selB]
    const pX = store.phrases[selX]
    if (!pA || !pB || !pX) return []

    const target = vectorNormalize(vectorAdd(pX.embedding, vectorSubtract(pB.embedding, pA.embedding)))

    return store.phrases
      .map((p, i) => ({
        ...p,
        originalIndex: i,
        score: cosineSimilarity(target, p.embedding),
        role: i === selA ? 'A' as const : i === selB ? 'B' as const : i === selX ? 'X' as const : null,
      }))
      .sort((a, b) => b.score - a.score)
  })

  function assign(role: 'A' | 'B' | 'X', index: number) {
    const current = role === 'A' ? selA : role === 'B' ? selB : selX
    // Toggle off if same role+phrase
    if (current === index) {
      if (role === 'A') selA = null
      else if (role === 'B') selB = null
      else selX = null
      return
    }
    // Clear this index from any other roles so one phrase = one role
    if (selA === index) selA = null
    if (selB === index) selB = null
    if (selX === index) selX = null
    // Assign
    if (role === 'A') selA = index
    else if (role === 'B') selB = index
    else selX = index
  }

  function roleOf(index: number): 'A' | 'B' | 'X' | null {
    if (selA === index) return 'A'
    if (selB === index) return 'B'
    if (selX === index) return 'X'
    return null
  }

  function scoreCategory(score: number): 'high' | 'mid' | 'low' {
    if (score >= 0.65) return 'high'
    if (score >= 0.35) return 'mid'
    return 'low'
  }

  const ready = $derived(selA !== null && selB !== null && selX !== null)
</script>

<div class="analogy-body">

  <!-- ── Left: role slots ───────────────────── -->
  <aside class="panel panel-left">
    <div class="panel-header">
      <span class="panel-tag">ROLES</span>
    </div>

    <div class="panel-body">
      <p class="formula-hint">A is to B as X is to ?</p>

      <!-- Role A -->
      <div class="role-group">
        <div class="role-slot" data-role="A">
          <span class="role-letter">A</span>
          <div class="role-content">
            {#if selA !== null}
              <span class="role-phrase">{store.phrases[selA].text}</span>
              <button class="role-clear" onclick={() => selA = null} aria-label="clear A">×</button>
            {:else}
              <span class="role-empty">select from list →</span>
            {/if}
          </div>
        </div>

        <!-- Role B -->
        <div class="role-slot" data-role="B">
          <span class="role-letter">B</span>
          <div class="role-content">
            {#if selB !== null}
              <span class="role-phrase">{store.phrases[selB].text}</span>
              <button class="role-clear" onclick={() => selB = null} aria-label="clear B">×</button>
            {:else}
              <span class="role-empty">select from list →</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="formula-box">
        <span class="formula">result = X + (B − A)</span>
      </div>

      <!-- Role X -->
      <div class="role-slot" data-role="X">
        <span class="role-letter">X</span>
        <div class="role-content">
          {#if selX !== null}
            <span class="role-phrase">{store.phrases[selX].text}</span>
            <button class="role-clear" onclick={() => selX = null} aria-label="clear X">×</button>
          {:else}
            <span class="role-empty">select from list →</span>
          {/if}
        </div>
      </div>

      {#if store.phrases.length < 3}
        <p class="warn">Add at least 3 phrases in the Explorer tab to use this feature.</p>
      {:else if !ready}
        <p class="hint">Assign A, B, and X from the phrase list to compute the analogy vector.</p>
      {/if}
    </div>
  </aside>

  <!-- ── Right: phrase pool + results ─────── -->
  <div class="right-col">

    <!-- Phrase pool -->
    <section class="panel panel-pool">
      <div class="panel-header">
        <span class="panel-tag">PHRASE POOL</span>
        <span class="panel-sub">click roles to assign</span>
      </div>

      <div class="pool-list">
        {#if store.phrases.length === 0}
          <div class="empty">
            <span class="empty-glyph">∅</span>
            <span class="empty-msg">no phrases — add some in Explorer</span>
          </div>
        {:else}
          {#each store.phrases as phrase, i}
            {@const r = roleOf(i)}
            <div class="pool-item" class:has-role={r !== null} data-role={r}>
              <span class="item-idx">{String(i + 1).padStart(2, '0')}</span>
              <span class="item-text">{phrase.text}</span>
              <div class="role-btns">
                {#each ['A', 'B', 'X'] as role (role)}
                  <button
                    class="role-btn"
                    class:active={(role === 'A' && selA === i) || (role === 'B' && selB === i) || (role === 'X' && selX === i)}
                    data-role={role}
                    onclick={() => assign(role as 'A' | 'B' | 'X', i)}
                    aria-label="{`assign ${role}`}"
                  >{role}</button>
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </section>

    <!-- Results -->
    {#if ready}
      <section class="panel panel-results">
        <div class="panel-header">
          <span class="panel-tag">RESULT SPACE</span>
          <span class="panel-sub result-formula">
            {store.phrases[selX!].text.slice(0, 20)}{store.phrases[selX!].text.length > 20 ? '…' : ''}
            + (B − A)
          </span>
        </div>

        <div class="result-list">
          {#each results as item, i (item.originalIndex)}
            {@const cat = scoreCategory(item.score)}
            <div
              class="result-item"
              class:cat-high={cat === 'high'}
              class:cat-mid={cat === 'mid'}
              class:cat-low={cat === 'low'}
              class:has-role={item.role !== null}
            >
              <div class="item-row">
                <span class="item-idx">{String(i + 1).padStart(2, '0')}</span>
                <span class="item-text">{item.text}</span>
                <span class="item-right">
                  {#if item.role}
                    <span class="role-pip" data-role={item.role}>{item.role}</span>
                  {/if}
                  <span class="item-score">{item.score.toFixed(3)}</span>
                </span>
              </div>
              <div class="score-track">
                <div class="score-fill" style="width: {item.score * 100}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .analogy-body {
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

  .panel-left  { border-right: 1px solid var(--border); }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.5rem;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .panel-tag  { font-size: 0.6rem; letter-spacing: 0.18em; color: var(--text-muted); font-weight: 500; }
  .panel-sub  { font-size: 0.57rem; letter-spacing: 0.1em; color: var(--text-dim); }

  .panel-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    overflow-y: auto;
  }

  /* ── Right column ────────────────────────── */
  .right-col {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .panel-pool {
    flex: 0 0 auto;
    max-height: 50%;
    border-bottom: 1px solid var(--border);
    background-image: radial-gradient(circle, rgba(39,64,48,.4) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  .panel-results {
    flex: 1;
    min-height: 0;
  }

  /* ── Role slots ──────────────────────────── */
  .formula-hint {
    font-size: 0.62rem;
    color: var(--text-dim);
    letter-spacing: 0.06em;
    font-style: italic;
  }

  .role-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .role-slot {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid var(--border);
    padding: 0.55rem 0.75rem;
    background: var(--surface);
    min-height: 2.4rem;
    transition: border-color 0.2s;
  }

  .role-slot[data-role="A"] { border-left: 2px solid rgba(74,222,128,.35); }
  .role-slot[data-role="B"] { border-left: 2px solid rgba(232,197,71,.35); }
  .role-slot[data-role="X"] { border-left: 2px solid rgba(99,179,237,.35); }

  .role-letter {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    line-height: 1;
    flex-shrink: 0;
    width: 1rem;
    text-align: center;
  }

  .role-slot[data-role="A"] .role-letter { color: var(--green); }
  .role-slot[data-role="B"] .role-letter { color: var(--amber); }
  .role-slot[data-role="X"] .role-letter { color: #63b3ed; }

  .role-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
  }

  .role-phrase {
    font-size: 0.72rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .role-empty {
    font-size: 0.65rem;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    opacity: 0.5;
  }

  .role-clear {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0 0.1rem;
    flex-shrink: 0;
    transition: color 0.15s;
  }

  .role-clear:hover { color: var(--text); }

  /* ── Formula box ─────────────────────────── */
  .formula-box {
    border: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    background: var(--surface);
    text-align: center;
  }

  .formula {
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    font-style: italic;
  }

  /* ── Hints / warnings ────────────────────── */
  .hint, .warn {
    font-size: 0.6rem;
    line-height: 1.7;
    margin-top: auto;
  }

  .hint { color: var(--text-dim); }
  .warn { color: rgba(248,113,113,.6); }

  /* ── Pool list ───────────────────────────── */
  .pool-list {
    flex: 1;
    overflow-y: auto;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 100px;
    color: var(--text-dim);
  }

  .empty-glyph { font-size: 1.5rem; opacity: 0.5; }
  .empty-msg   { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; }

  .pool-item {
    padding: 0.65rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.65rem;
    transition: background 0.12s;
  }

  .pool-item:hover { background: rgba(15,22,16,.7); }

  .pool-item.has-role[data-role="A"] { background: rgba(74,222,128,.05); }
  .pool-item.has-role[data-role="B"] { background: rgba(232,197,71,.05); }
  .pool-item.has-role[data-role="X"] { background: rgba(99,179,237,.05); }

  /* ── Role buttons ────────────────────────── */
  .role-btns {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .role-btn {
    width: 1.4rem;
    height: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.05em;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.15s;
  }

  .role-btn:hover { border-color: var(--border-bright); color: var(--text); }

  .role-btn[data-role="A"].active { background: rgba(74,222,128,.12);  border-color: rgba(74,222,128,.4);  color: var(--green); }
  .role-btn[data-role="B"].active { background: rgba(232,197,71,.12); border-color: rgba(232,197,71,.4); color: var(--amber); }
  .role-btn[data-role="X"].active { background: rgba(99,179,237,.12);  border-color: rgba(99,179,237,.4);  color: #63b3ed; }

  /* ── Results ─────────────────────────────── */
  .result-formula { font-style: italic; }

  .result-list {
    flex: 1;
    overflow-y: auto;
  }

  .result-item {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--border);
    transition: background 0.12s;
  }

  .result-item.has-role { background: rgba(255,255,255,.02); }

  .item-row {
    display: flex;
    align-items: baseline;
    gap: 0.65rem;
  }

  .item-idx  { font-size: 0.52rem; color: var(--text-dim); flex-shrink: 0; letter-spacing: 0.04em; opacity: 0.6; }
  .item-text { flex: 1; font-size: 0.825rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

  .item-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .role-pip {
    font-size: 0.55rem;
    letter-spacing: 0.06em;
    padding: 0.1em 0.4em;
    border: 1px solid;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.7rem;
    line-height: 1.2;
  }

  .role-pip[data-role="A"] { color: var(--green); border-color: rgba(74,222,128,.3);  background: rgba(74,222,128,.08); }
  .role-pip[data-role="B"] { color: var(--amber); border-color: rgba(232,197,71,.3); background: rgba(232,197,71,.08); }
  .role-pip[data-role="X"] { color: #63b3ed;      border-color: rgba(99,179,237,.3);  background: rgba(99,179,237,.08); }

  .item-score {
    font-size: 0.825rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .cat-high .item-score { color: var(--green); }
  .cat-mid  .item-score { color: var(--text-muted); }
  .cat-low  .item-score { color: var(--red); }

  /* ── Score bar ───────────────────────────── */
  .score-track {
    height: 2px;
    background: var(--border);
    margin-top: 0.5rem;
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
    .analogy-body  { grid-template-columns: 1fr; }
    .panel-left    { border-right: none; border-bottom: 1px solid var(--border); }
    .panel-pool    { max-height: none; }
  }
</style>
