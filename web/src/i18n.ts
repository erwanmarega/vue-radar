import { ref, computed } from 'vue'

export type Locale = 'en' | 'fr'

type Dict = Record<string, string>

const messages: Record<Locale, Dict> = {
  en: {
    // nav
    'nav.github': 'github',
    'nav.npm': 'npm',
    // hero
    'hero.tagline': 'Catch bad Vue before it ships.',
    'hero.title.l1': 'Static analysis',
    'hero.title.l2': 'for Vue.js codebases.',
    'hero.desc.l1': '24 rules across security, correctness, performance,',
    'hero.desc.l2': 'architecture, composition, and Nuxt. Zero config.',
    'hero.cta.or': 'or',
    'hero.cta.skill': 'for agent skill',
    // rules
    'rules.label': 'rules',
    'rules.cat.security': 'security',
    'rules.cat.correctness': 'correctness',
    'rules.cat.performance': 'performance',
    'rules.cat.architecture': 'architecture',
    'rules.cat.composition': 'composition',
    'rules.cat.nuxt': 'nuxt',
    // footer
    'footer.meta': 'MIT · Vue 3 · Nuxt 3',
    // rule messages (keyed by rule id)
    'rule.v-html-unsafe': 'v-html without sanitization — XSS',
    'rule.nuxt-server-import-in-client': 'Node.js built-in imported in component',
    'rule.dynamic-href-unsafe': 'Dynamic :href may allow javascript: URLs',
    'rule.v-if-v-for-same-element': 'v-if + v-for on same element',
    'rule.direct-reactive-mutation': 'reactive() object directly replaced',
    'rule.side-effect-in-computed': 'Side effect inside computed()',
    'rule.lifecycle-outside-setup': 'Lifecycle hook outside setup()',
    'rule.nuxt-usefetch-outside-setup': 'useFetch outside Nuxt setup context',
    'rule.nuxt-use-route-outside-setup': 'useRoute/useRouter outside setup',
    'rule.missing-key-in-v-for': 'v-for without :key',
    'rule.missing-dot-value': 'ref used without .value',
    'rule.nuxt-fetch-no-error-handling': 'useFetch without error destructuring',
    'rule.watch-missing-cleanup': 'Async fetch in watch() without cleanup',
    'rule.missing-on-unmounted-cleanup': 'addEventListener/setInterval without cleanup',
    'rule.v-for-index-as-key': 'Array index used as :key',
    'rule.no-async-component': 'Component statically imported (not lazy)',
    'rule.missing-shallow-ref': 'ref() on large object — use shallowRef()',
    'rule.inline-complex-handler': 'Long inline event handler in template',
    'rule.missing-define-emits': 'emit() without defineEmits()',
    'rule.missing-define-props': 'props used without defineProps()',
    'rule.component-too-large': 'Component over 400 lines',
    'rule.no-explicit-any': 'Explicit any type in script',
    'rule.missing-expose': 'Template refs without defineExpose()',
    'rule.nuxt-missing-page-meta': 'Nuxt page without definePageMeta()',
  },
  fr: {
    // nav
    'nav.github': 'github',
    'nav.npm': 'npm',
    // hero
    'hero.tagline': 'Détectez le mauvais Vue avant la mise en prod.',
    'hero.title.l1': 'Analyse statique',
    'hero.title.l2': 'pour bases de code Vue.js.',
    'hero.desc.l1': '24 règles : sécurité, justesse, performance,',
    'hero.desc.l2': 'architecture, composition et Nuxt. Zéro config.',
    'hero.cta.or': 'ou',
    'hero.cta.skill': 'pour le skill agent',
    // rules
    'rules.label': 'règles',
    'rules.cat.security': 'sécurité',
    'rules.cat.correctness': 'justesse',
    'rules.cat.performance': 'performance',
    'rules.cat.architecture': 'architecture',
    'rules.cat.composition': 'composition',
    'rules.cat.nuxt': 'nuxt',
    // footer
    'footer.meta': 'MIT · Vue 3 · Nuxt 3',
    // rule messages (keyed by rule id)
    'rule.v-html-unsafe': 'v-html sans assainissement — XSS',
    'rule.nuxt-server-import-in-client': 'Module Node.js importé dans un composant',
    'rule.dynamic-href-unsafe': ':href dynamique peut autoriser des URL javascript:',
    'rule.v-if-v-for-same-element': 'v-if + v-for sur le même élément',
    'rule.direct-reactive-mutation': 'objet reactive() remplacé directement',
    'rule.side-effect-in-computed': 'Effet de bord dans computed()',
    'rule.lifecycle-outside-setup': 'Hook de cycle de vie hors de setup()',
    'rule.nuxt-usefetch-outside-setup': 'useFetch hors du contexte setup Nuxt',
    'rule.nuxt-use-route-outside-setup': 'useRoute/useRouter hors de setup',
    'rule.missing-key-in-v-for': 'v-for sans :key',
    'rule.missing-dot-value': 'ref utilisée sans .value',
    'rule.nuxt-fetch-no-error-handling': 'useFetch sans déstructuration de error',
    'rule.watch-missing-cleanup': 'Fetch async dans watch() sans nettoyage',
    'rule.missing-on-unmounted-cleanup': 'addEventListener/setInterval sans nettoyage',
    'rule.v-for-index-as-key': "Index de tableau utilisé comme :key",
    'rule.no-async-component': 'Composant importé statiquement (non lazy)',
    'rule.missing-shallow-ref': 'ref() sur gros objet — utilisez shallowRef()',
    'rule.inline-complex-handler': 'Gestionnaire inline trop long dans le template',
    'rule.missing-define-emits': 'emit() sans defineEmits()',
    'rule.missing-define-props': 'props utilisées sans defineProps()',
    'rule.component-too-large': 'Composant de plus de 400 lignes',
    'rule.no-explicit-any': 'Type any explicite dans le script',
    'rule.missing-expose': 'Refs de template sans defineExpose()',
    'rule.nuxt-missing-page-meta': 'Page Nuxt sans definePageMeta()',
  },
}

function detectLocale(): Locale {
  const stored = localStorage.getItem('locale')
  if (stored === 'en' || stored === 'fr') return stored
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

// Shared reactive locale — single source of truth across components.
const locale = ref<Locale>(detectLocale())

export function setLocale(next: Locale) {
  locale.value = next
  localStorage.setItem('locale', next)
  document.documentElement.lang = next
}

export function useI18n() {
  const t = (key: string): string => messages[locale.value][key] ?? key
  const lang = computed(() => locale.value)
  return { t, lang, setLocale }
}
