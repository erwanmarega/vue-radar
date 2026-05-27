<template>
  <footer>
    <div class="container inner">
      <span class="logo">vue-radar</span>
      <span class="sep">·</span>
      <span class="meta">MIT · 24 rules · Vue 3 · Nuxt 3</span>
      <div class="links">
        <a href="https://github.com/your-org/vue-radar" target="_blank">github →</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
footer {
  padding: 32px 0;
  margin-top: auto;
}

.inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo { color: var(--green); font-size: 0.82rem; font-weight: 700; }
.sep  { color: var(--border); }
.meta { color: var(--muted); font-size: 0.75rem; flex: 1; }

.links a { color: var(--muted); font-size: 0.75rem; transition: color 0.1s; }
.links a:hover { color: var(--text); text-decoration: none; }
</style>
