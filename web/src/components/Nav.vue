<template>
  <nav>
    <div class="container inner">
      <span class="logo">vue-radar<span class="cursor-blink">_</span></span>
      <div class="links">
        <a href="#install">install</a>
        <a href="#rules">rules</a>
        <a href="https://github.com/your-org/vue-radar" target="_blank">github</a>
        <a href="https://www.npmjs.com/package/vue-radar" class="npm-badge" target="_blank">npm</a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  border-bottom: 1px solid var(--border);
  padding: 14px 0;
  position: sticky;
  top: 0;
  background: rgba(12, 12, 12, 0.92);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-weight: 700;
  color: var(--green);
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.cursor-blink {
  animation: blink 1.2s step-end infinite;
}
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

.links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.links a {
  color: var(--muted);
  font-size: 0.82rem;
  transition: color 0.1s;
}
.links a:hover { color: var(--text); text-decoration: none; }

.npm-badge {
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.75rem;
}
</style>
