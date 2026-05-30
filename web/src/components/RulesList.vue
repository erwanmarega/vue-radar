<template>
  <section class="rules">
    <div class="container">

      <div class="rules-header" v-reveal>
        <span class="label">{{ t('rules.label') }}</span>
        <span class="count muted">{{ total }}</span>
        <div class="filters">
          <button
            v-for="cat in cats"
            :key="cat"
            :class="['f', { active: active === cat }]"
            @click="active = active === cat ? null : cat"
          >{{ t('rules.cat.' + cat) }}</button>
        </div>
      </div>

      <div class="list" v-reveal>
        <div
          v-for="r in visible"
          :key="r.id"
          class="row"
        >
          <span :class="['sev', r.sev]">{{ r.sev[0] }}</span>
          <span class="id">{{ r.id }}</span>
          <span class="msg">{{ t('rule.' + r.id) }}</span>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

const active = ref<string | null>(null)

const ALL = [
  { id: 'v-html-unsafe',               msg: 'v-html without sanitization — XSS',               cat: 'security',     sev: 'error' },
  { id: 'nuxt-server-import-in-client', msg: 'Node.js built-in imported in component',          cat: 'nuxt',         sev: 'error' },
  { id: 'dynamic-href-unsafe',          msg: 'Dynamic :href may allow javascript: URLs',         cat: 'security',     sev: 'warning' },
  { id: 'v-if-v-for-same-element',      msg: 'v-if + v-for on same element',                    cat: 'correctness',  sev: 'error' },
  { id: 'direct-reactive-mutation',     msg: 'reactive() object directly replaced',             cat: 'correctness',  sev: 'error' },
  { id: 'side-effect-in-computed',      msg: 'Side effect inside computed()',                   cat: 'composition',  sev: 'error' },
  { id: 'lifecycle-outside-setup',      msg: 'Lifecycle hook outside setup()',                  cat: 'composition',  sev: 'error' },
  { id: 'nuxt-usefetch-outside-setup',  msg: 'useFetch outside Nuxt setup context',             cat: 'nuxt',         sev: 'error' },
  { id: 'nuxt-use-route-outside-setup', msg: 'useRoute/useRouter outside setup',                cat: 'nuxt',         sev: 'error' },
  { id: 'missing-key-in-v-for',         msg: 'v-for without :key',                             cat: 'correctness',  sev: 'warning' },
  { id: 'missing-dot-value',            msg: 'ref used without .value',                         cat: 'correctness',  sev: 'warning' },
  { id: 'nuxt-fetch-no-error-handling', msg: 'useFetch without error destructuring',            cat: 'nuxt',         sev: 'warning' },
  { id: 'watch-missing-cleanup',        msg: 'Async fetch in watch() without cleanup',          cat: 'composition',  sev: 'warning' },
  { id: 'missing-on-unmounted-cleanup', msg: 'addEventListener/setInterval without cleanup',    cat: 'composition',  sev: 'warning' },
  { id: 'v-for-index-as-key',           msg: 'Array index used as :key',                       cat: 'performance',  sev: 'warning' },
  { id: 'no-async-component',           msg: 'Component statically imported (not lazy)',        cat: 'performance',  sev: 'info' },
  { id: 'missing-shallow-ref',          msg: 'ref() on large object — use shallowRef()',        cat: 'performance',  sev: 'info' },
  { id: 'inline-complex-handler',       msg: 'Long inline event handler in template',           cat: 'performance',  sev: 'info' },
  { id: 'missing-define-emits',         msg: 'emit() without defineEmits()',                    cat: 'architecture', sev: 'warning' },
  { id: 'missing-define-props',         msg: 'props used without defineProps()',                cat: 'architecture', sev: 'warning' },
  { id: 'component-too-large',          msg: 'Component over 400 lines',                       cat: 'architecture', sev: 'error' },
  { id: 'no-explicit-any',             msg: 'Explicit any type in script',                     cat: 'architecture', sev: 'info' },
  { id: 'missing-expose',              msg: 'Template refs without defineExpose()',             cat: 'architecture', sev: 'info' },
  { id: 'nuxt-missing-page-meta',      msg: 'Nuxt page without definePageMeta()',              cat: 'nuxt',         sev: 'info' },
]

const cats = ['security', 'correctness', 'performance', 'architecture', 'composition', 'nuxt']
const total = ALL.length

const visible = computed(() =>
  active.value ? ALL.filter(r => r.cat === active.value) : ALL
)
</script>

<style scoped>
.rules {
  padding: 80px 0 100px;
}

.rules-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.label {
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.count {
  font-size: 0.68rem;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 10px;
}

.filters {
  display: flex;
  gap: 6px;
  margin-left: 8px;
}

.f {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: 3px;
  cursor: pointer;
  transition: color .1s, border-color .1s;
}
.f:hover { color: var(--text); }
.f.active { color: var(--text); border-color: #444; }

/* list */
.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 14px 260px 1fr;
  gap: 16px;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.75rem;
  transition: transform 0.15s ease, background 0.15s ease;
}
.row:last-child { border-bottom: none; }
.row:hover {
  transform: translateX(4px);
  background: rgba(61, 220, 132, 0.03);
}
.row:hover .id { color: var(--text); }

.sev {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.sev.error   { color: var(--red); }
.sev.warning { color: var(--yellow); }
.sev.info    { color: var(--blue); }

.id  { color: var(--purple); font-size: 0.73rem; transition: color .1s; }
.msg { color: var(--muted); }
</style>
