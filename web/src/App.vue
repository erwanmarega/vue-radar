<template>
  <div class="page">
    <header>
      <div class="container nav">
        <span class="logo">vue-radar</span>
        <nav>
          <a href="https://github.com/your-org/vue-radar" target="_blank">github</a>
          <a href="https://npmjs.com/package/vue-radar" target="_blank">npm</a>
        </nav>
      </div>
    </header>

    <main>
      <Hero />
      <RulesList />
    </main>

    <footer>
      <div class="container foot">
        <span class="muted">MIT · Vue 3 · Nuxt 3</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Hero from './components/Hero.vue'
import RulesList from './components/RulesList.vue'
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }

header {
  padding: 22px 0;
  border-bottom: 1px solid var(--border);
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: var(--green);
  font-size: 0.85rem;
  font-weight: 700;
}

nav { display: flex; gap: 20px; }
nav a { font-size: 0.75rem; color: var(--muted); }
nav a:hover { color: var(--text); }

main { flex: 1; }

footer { border-top: 1px solid var(--border); padding: 20px 0; }
.foot { display: flex; justify-content: center; }
.muted { color: var(--muted); font-size: 0.72rem; }
</style>
