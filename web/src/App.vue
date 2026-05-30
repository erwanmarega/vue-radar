<template>
  <div class="page">
    <header>
      <div class="container nav">
        <span class="logo">vue-radar</span>
        <nav>
          <a href="https://github.com/your-org/vue-radar" target="_blank">{{ t('nav.github') }}</a>
          <a href="https://npmjs.com/package/vue-radar" target="_blank">{{ t('nav.npm') }}</a>
          <div class="lang">
            <button :class="{ active: lang === 'en' }" @click="setLocale('en')">EN</button>
            <span class="sep">/</span>
            <button :class="{ active: lang === 'fr' }" @click="setLocale('fr')">FR</button>
          </div>
        </nav>
      </div>
    </header>

    <main>
      <Hero />
      <RulesList />
    </main>

    <footer>
      <div class="container foot">
        <span class="muted">{{ t('footer.meta') }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Hero from './components/Hero.vue'
import RulesList from './components/RulesList.vue'
import { useI18n } from './i18n'

const { t, lang, setLocale } = useI18n()
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

nav { display: flex; gap: 20px; align-items: center; }
nav a { font-size: 0.75rem; color: var(--muted); }
nav a:hover { color: var(--text); }

.lang { display: flex; align-items: center; gap: 6px; }
.lang button {
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}
.lang button:hover { color: var(--text); }
.lang button.active { color: var(--green); }
.lang .sep { color: var(--border); font-size: 0.72rem; }

main { flex: 1; }

footer { border-top: 1px solid var(--border); padding: 20px 0; }
.foot { display: flex; justify-content: center; }
.muted { color: var(--muted); font-size: 0.72rem; }
</style>
