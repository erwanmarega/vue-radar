<template>
  <section id="rules" class="section">
    <div class="container">
      <div class="section-head">
        <span class="section-num">02</span>
        <h2>Rules <span class="count">{{ totalRules }}</span></h2>
      </div>

      <div class="filter-row">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="filter-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = activeCategory === cat.id ? null : cat.id"
        >
          <span class="cat-dot" :class="'cat-' + cat.id"></span>
          {{ cat.label }}
          <span class="cat-n">{{ cat.rules.length }}</span>
        </button>
      </div>

      <table class="rules-table">
        <thead>
          <tr>
            <th>rule id</th>
            <th>description</th>
            <th>sev</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in visibleRules" :key="rule.id" :class="'row-' + rule.sev">
            <td class="rule-id">{{ rule.id }}</td>
            <td class="rule-desc">{{ rule.desc }}</td>
            <td class="rule-sev" :class="'sev-' + rule.sev">{{ rule.sev }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="activeCategory" class="clear-row">
        <button class="clear-btn" @click="activeCategory = null">clear filter</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const activeCategory = ref<string | null>(null)

const categories = [
  {
    id: 'security', label: 'security',
    rules: [
      { id: 'v-html-unsafe', desc: 'v-html renders raw HTML — XSS vector', sev: 'error' },
      { id: 'dynamic-href-unsafe', desc: 'Dynamic :href may allow javascript: URLs', sev: 'warning' },
      { id: 'nuxt-server-import-in-client', desc: 'Node.js built-in imported in component', sev: 'error' },
    ],
  },
  {
    id: 'correctness', label: 'correctness',
    rules: [
      { id: 'v-if-v-for-same-element', desc: 'v-if + v-for on same element', sev: 'error' },
      { id: 'missing-key-in-v-for', desc: 'v-for without :key', sev: 'warning' },
      { id: 'missing-dot-value', desc: 'ref used without .value', sev: 'warning' },
      { id: 'direct-reactive-mutation', desc: 'reactive() object directly replaced', sev: 'error' },
      { id: 'nuxt-fetch-no-error-handling', desc: 'useFetch without error destructuring', sev: 'warning' },
    ],
  },
  {
    id: 'performance', label: 'performance',
    rules: [
      { id: 'no-async-component', desc: 'Component statically imported (not lazy)', sev: 'info' },
      { id: 'inline-complex-handler', desc: 'Long inline event handler in template', sev: 'info' },
      { id: 'missing-shallow-ref', desc: 'ref() on large object — use shallowRef()', sev: 'info' },
      { id: 'v-for-index-as-key', desc: 'Array index used as :key', sev: 'warning' },
    ],
  },
  {
    id: 'architecture', label: 'architecture',
    rules: [
      { id: 'missing-define-emits', desc: 'emit() without defineEmits()', sev: 'warning' },
      { id: 'missing-define-props', desc: 'props used without defineProps()', sev: 'warning' },
      { id: 'component-too-large', desc: 'Component over 400 lines', sev: 'error' },
      { id: 'no-explicit-any', desc: 'Explicit any type in script', sev: 'info' },
      { id: 'missing-expose', desc: 'Template refs without defineExpose()', sev: 'info' },
      { id: 'nuxt-missing-page-meta', desc: 'Nuxt page without definePageMeta()', sev: 'info' },
    ],
  },
  {
    id: 'composition', label: 'composition',
    rules: [
      { id: 'watch-missing-cleanup', desc: 'Async fetch in watch() without cleanup', sev: 'warning' },
      { id: 'side-effect-in-computed', desc: 'Side effect inside computed()', sev: 'error' },
      { id: 'lifecycle-outside-setup', desc: 'Lifecycle hook outside setup()', sev: 'error' },
      { id: 'missing-on-unmounted-cleanup', desc: 'addEventListener/setInterval without cleanup', sev: 'warning' },
      { id: 'nuxt-usefetch-outside-setup', desc: 'useFetch outside Nuxt setup context', sev: 'error' },
      { id: 'nuxt-use-route-outside-setup', desc: 'useRoute/useRouter outside setup', sev: 'error' },
    ],
  },
]

const totalRules = computed(() => categories.reduce((n, c) => n + c.rules.length, 0))

const visibleRules = computed(() => {
  const cats = activeCategory.value
    ? categories.filter(c => c.id === activeCategory.value)
    : categories
  return cats.flatMap(c => c.rules)
})
</script>

<style scoped>
.section {
  padding: 72px 0;
  border-bottom: 1px solid var(--border);
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 28px;
}
.section-num { font-size: 0.72rem; color: var(--muted); letter-spacing: 0.1em; }
h2 { font-size: 1.3rem; font-weight: 700; }
.count {
  font-size: 0.75rem;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 8px;
  vertical-align: middle;
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border);
  padding: 4px 12px;
  border-radius: 3px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.1s;
}
.filter-btn:hover { color: var(--text); border-color: var(--dim); }
.filter-btn.active { color: var(--text); border-color: var(--green); }

.cat-dot { width: 6px; height: 6px; border-radius: 50%; }
.cat-security    { background: var(--red); }
.cat-correctness { background: var(--yellow); }
.cat-performance { background: var(--blue); }
.cat-architecture{ background: var(--purple); }
.cat-composition { background: var(--green); }

.cat-n { color: var(--muted); font-size: 0.7rem; }

.rules-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.78rem;
}

thead th {
  background: var(--surface);
  padding: 8px 14px;
  text-align: left;
  color: var(--muted);
  font-weight: 400;
  border-bottom: 1px solid var(--border);
  letter-spacing: 0.05em;
}

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.08s;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--surface); }

td { padding: 9px 14px; }

.rule-id { color: var(--purple); font-size: 0.76rem; white-space: nowrap; }
.rule-desc { color: var(--muted); }
.rule-sev { text-align: right; font-size: 0.7rem; white-space: nowrap; letter-spacing: 0.05em; }

.sev-error   { color: var(--red); }
.sev-warning { color: var(--yellow); }
.sev-info    { color: var(--blue); }

.clear-row { margin-top: 12px; }
.clear-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
}
.clear-btn:hover { color: var(--text); }
</style>
