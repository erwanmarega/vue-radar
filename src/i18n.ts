import type { Category } from './types'

export type Lang = 'en' | 'fr'

export interface Localized {
  message: string
  fix: string
}

type Params = Record<string, string | number>
type Entry = { message: (p: Params) => string; fix: (p: Params) => string }

const s = (str: string) => () => str

const en: Record<string, Entry> = {
  'v-html-unsafe': {
    message: s('v-html renders raw HTML and is vulnerable to XSS. Use text interpolation {{ }} or sanitize with DOMPurify first.'),
    fix: s('Replace v-html with {{ }} or sanitize: v-html="sanitize(content)"'),
  },
  'dynamic-href-unsafe': {
    message: p => `Dynamic :href on <a> may allow javascript: URLs (bound to: ${p.exp}). Validate the value.`,
    fix: s('Validate URL: const safeHref = computed(() => /^https?:\\/\\//.test(url) ? url : "#")'),
  },
  'v-if-v-for-same-element': {
    message: s('v-if and v-for on the same element. In Vue 3, v-if takes priority — it cannot access v-for variables.'),
    fix: s('Wrap with <template v-for> and put v-if on the inner element, or filter the array with computed().'),
  },
  'missing-key-in-v-for': {
    message: s('v-for without :key. Vue cannot efficiently patch the DOM without stable keys.'),
    fix: s('Add :key="item.id" — use a stable unique identifier, not the loop index.'),
  },
  'missing-dot-value': {
    message: p => `"${p.name}" is a ref but is assigned without .value. This overwrites the ref object, losing reactivity.`,
    fix: p => `Use ${p.name}.value = ... instead of ${p.name} = ...`,
  },
  'direct-reactive-mutation': {
    message: p => `Replacing reactive object "${p.name}" breaks reactivity. The proxy reference becomes stale.`,
    fix: p => `Mutate properties in-place: Object.assign(${p.name}, newData) or use ref() instead.`,
  },
  'no-async-component': {
    message: p => `Static import of "${p.name}" increases initial bundle size.`,
    fix: p => `const ${p.name} = defineAsyncComponent(() => import('${p.source}'))`,
  },
  'inline-complex-handler': {
    message: s('Long inline event handler in template. Hard to test and re-parsed on every render.'),
    fix: s('Extract to a named method in <script setup>.'),
  },
  'missing-shallow-ref': {
    message: s('ref() deep-tracks all nested properties. For large arrays/objects, consider shallowRef().'),
    fix: s('Use shallowRef() if you only replace the whole value, not mutate nested props.'),
  },
  'v-for-index-as-key': {
    message: s('Array index as :key causes wrong DOM reuse when list order changes.'),
    fix: s('Use a stable unique ID: :key="item.id"'),
  },
  'missing-define-emits': {
    message: s('Component emits events but has no defineEmits(). Missing type contract and IDE autocomplete.'),
    fix: s('Add: const emit = defineEmits<{ change: [value: string] }>()'),
  },
  'missing-define-props': {
    message: s('Component accesses props without defineProps(). Props are untyped and unvalidated.'),
    fix: s('Add: const props = defineProps<{ title: string }>()'),
  },
  'component-too-large-error': {
    message: p => `Component is ${p.lines} lines. Components over 400 lines are hard to test and understand.`,
    fix: s('Extract composables (useXxx.ts) for logic, split template into child components.'),
  },
  'component-too-large-warn': {
    message: p => `Component is ${p.lines} lines. Consider splitting logic into composables.`,
    fix: s('Extract reusable logic to composables/useXxx.ts'),
  },
  'no-explicit-any': {
    message: s('Explicit `any` type. Loses type safety across the component boundary.'),
    fix: s('Use `unknown` and narrow with type guards, or define an interface.'),
  },
  'missing-expose': {
    message: s('Component uses template refs internally. If parent accesses this ref, add defineExpose() to control the public API.'),
    fix: s('Add defineExpose({ methodName }) to explicitly expose what parent can access.'),
  },
  'watch-missing-cleanup': {
    message: s('Async fetch inside watch() without cleanup. Causes race conditions when deps change rapidly.'),
    fix: s('Use onWatcherCleanup(() => controller.abort()) or AbortController to cancel stale requests.'),
  },
  'side-effect-in-computed': {
    message: s('Side effect inside computed(). Computed should be pure — only derive state, no mutations or async calls.'),
    fix: s('Move side effects to watch(), watchEffect(), or an event handler.'),
  },
  'lifecycle-outside-setup': {
    message: s('Composition API lifecycle hook called outside setup(). Hook will be silently ignored.'),
    fix: s('Move lifecycle hooks inside setup() or use <script setup>.'),
  },
  'missing-on-unmounted-listener': {
    message: s('addEventListener() without removeEventListener() in onUnmounted(). Memory leak on component destroy.'),
    fix: s('Add onUnmounted(() => el.removeEventListener(...))'),
  },
  'missing-on-unmounted-interval': {
    message: s('setInterval() without clearInterval() in onUnmounted(). Timer keeps running after component unmounts.'),
    fix: s('Add onUnmounted(() => clearInterval(timer))'),
  },
  'nuxt-usefetch-outside-setup': {
    message: s('useFetch/useAsyncData called outside setup(). These composables require the Nuxt composable context.'),
    fix: s('Move into setup() or use <script setup>.'),
  },
  'nuxt-missing-page-meta': {
    message: s('Nuxt page component without definePageMeta(). Missing route metadata (title, middleware, layout, auth).'),
    fix: s("Add: definePageMeta({ title: 'Page Title', middleware: 'auth' })"),
  },
  'nuxt-use-route-outside-setup': {
    message: s('Nuxt composable called outside setup context. Will throw "nuxt instance unavailable".'),
    fix: s('Move into setup() or use <script setup>.'),
  },
  'nuxt-fetch-no-error-handling': {
    message: s('useFetch/useAsyncData without destructuring error. Network failures silently produce undefined data.'),
    fix: s('Destructure: const { data, error, pending } = useFetch(...) and handle error in template.'),
  },
  'nuxt-server-import-in-client': {
    message: p => `Node.js built-in "${p.mod}" imported in a component. Runs on client = crashes browser; exposes server internals.`,
    fix: s('Move to server/api/ route or use #imports to access server-only utils.'),
  },
}

const fr: Record<string, Entry> = {
  'v-html-unsafe': {
    message: s('v-html rend du HTML brut et expose à des failles XSS. Utilise l’interpolation {{ }} ou nettoie avec DOMPurify.'),
    fix: s('Remplace v-html par {{ }} ou nettoie : v-html="sanitize(content)"'),
  },
  'dynamic-href-unsafe': {
    message: p => `:href dynamique sur <a> peut autoriser des URLs javascript: (lié à : ${p.exp}). Valide la valeur.`,
    fix: s('Valide l’URL : const safeHref = computed(() => /^https?:\\/\\//.test(url) ? url : "#")'),
  },
  'v-if-v-for-same-element': {
    message: s('v-if et v-for sur le même élément. En Vue 3, v-if est prioritaire — il ne peut pas accéder aux variables de v-for.'),
    fix: s('Encapsule dans <template v-for> et mets v-if sur l’élément interne, ou filtre le tableau avec computed().'),
  },
  'missing-key-in-v-for': {
    message: s('v-for sans :key. Vue ne peut pas patcher le DOM efficacement sans clés stables.'),
    fix: s('Ajoute :key="item.id" — un identifiant unique stable, pas l’index de boucle.'),
  },
  'missing-dot-value': {
    message: p => `"${p.name}" est un ref mais est assigné sans .value. Ça écrase l’objet ref et casse la réactivité.`,
    fix: p => `Utilise ${p.name}.value = ... au lieu de ${p.name} = ...`,
  },
  'direct-reactive-mutation': {
    message: p => `Remplacer l’objet reactive "${p.name}" casse la réactivité. La référence du proxy devient obsolète.`,
    fix: p => `Mute les propriétés sur place : Object.assign(${p.name}, newData) ou utilise ref().`,
  },
  'no-async-component': {
    message: p => `Import statique de "${p.name}" augmente la taille du bundle initial.`,
    fix: p => `const ${p.name} = defineAsyncComponent(() => import('${p.source}'))`,
  },
  'inline-complex-handler': {
    message: s('Gestionnaire d’événement inline trop long dans le template. Difficile à tester et re-parsé à chaque rendu.'),
    fix: s('Extrais dans une méthode nommée dans <script setup>.'),
  },
  'missing-shallow-ref': {
    message: s('ref() suit en profondeur toutes les propriétés imbriquées. Pour gros tableaux/objets, envisage shallowRef().'),
    fix: s('Utilise shallowRef() si tu remplaces toute la valeur sans muter les propriétés imbriquées.'),
  },
  'v-for-index-as-key': {
    message: s('L’index du tableau comme :key cause une mauvaise réutilisation du DOM quand l’ordre de la liste change.'),
    fix: s('Utilise un ID unique stable : :key="item.id"'),
  },
  'missing-define-emits': {
    message: s('Le composant émet des événements sans defineEmits(). Pas de contrat de type ni d’autocomplétion IDE.'),
    fix: s('Ajoute : const emit = defineEmits<{ change: [value: string] }>()'),
  },
  'missing-define-props': {
    message: s('Le composant accède aux props sans defineProps(). Props non typées et non validées.'),
    fix: s('Ajoute : const props = defineProps<{ title: string }>()'),
  },
  'component-too-large-error': {
    message: p => `Composant de ${p.lines} lignes. Au-delà de 400 lignes, difficile à tester et à comprendre.`,
    fix: s('Extrais des composables (useXxx.ts), découpe le template en composants enfants.'),
  },
  'component-too-large-warn': {
    message: p => `Composant de ${p.lines} lignes. Envisage d’extraire la logique en composables.`,
    fix: s('Extrais la logique réutilisable dans composables/useXxx.ts'),
  },
  'no-explicit-any': {
    message: s('Type `any` explicite. Perte de sûreté de typage à la frontière du composant.'),
    fix: s('Utilise `unknown` et affine avec des type guards, ou définis une interface.'),
  },
  'missing-expose': {
    message: s('Le composant utilise des refs de template en interne. Si le parent y accède, ajoute defineExpose() pour contrôler l’API publique.'),
    fix: s('Ajoute defineExpose({ methodName }) pour exposer explicitement ce que le parent peut utiliser.'),
  },
  'watch-missing-cleanup': {
    message: s('Fetch asynchrone dans watch() sans nettoyage. Provoque des race conditions quand les deps changent vite.'),
    fix: s('Utilise onWatcherCleanup(() => controller.abort()) ou AbortController pour annuler les requêtes obsolètes.'),
  },
  'side-effect-in-computed': {
    message: s('Effet de bord dans computed(). computed doit être pur — seulement dériver l’état, sans mutation ni appel async.'),
    fix: s('Déplace les effets de bord dans watch(), watchEffect() ou un gestionnaire d’événement.'),
  },
  'lifecycle-outside-setup': {
    message: s('Hook de cycle de vie (Composition API) appelé hors de setup(). Le hook sera ignoré silencieusement.'),
    fix: s('Place les hooks de cycle de vie dans setup() ou utilise <script setup>.'),
  },
  'missing-on-unmounted-listener': {
    message: s('addEventListener() sans removeEventListener() dans onUnmounted(). Fuite mémoire à la destruction du composant.'),
    fix: s('Ajoute onUnmounted(() => el.removeEventListener(...))'),
  },
  'missing-on-unmounted-interval': {
    message: s('setInterval() sans clearInterval() dans onUnmounted(). Le timer continue après le démontage.'),
    fix: s('Ajoute onUnmounted(() => clearInterval(timer))'),
  },
  'nuxt-usefetch-outside-setup': {
    message: s('useFetch/useAsyncData appelé hors de setup(). Ces composables nécessitent le contexte composable Nuxt.'),
    fix: s('Place dans setup() ou utilise <script setup>.'),
  },
  'nuxt-missing-page-meta': {
    message: s('Page Nuxt sans definePageMeta(). Métadonnées de route manquantes (title, middleware, layout, auth).'),
    fix: s("Ajoute : definePageMeta({ title: 'Titre', middleware: 'auth' })"),
  },
  'nuxt-use-route-outside-setup': {
    message: s('Composable Nuxt appelé hors du contexte setup. Lèvera "nuxt instance unavailable".'),
    fix: s('Place dans setup() ou utilise <script setup>.'),
  },
  'nuxt-fetch-no-error-handling': {
    message: s('useFetch/useAsyncData sans destructurer error. Les échecs réseau produisent silencieusement des données undefined.'),
    fix: s('Destructure : const { data, error, pending } = useFetch(...) et gère error dans le template.'),
  },
  'nuxt-server-import-in-client': {
    message: p => `Module natif Node.js "${p.mod}" importé dans un composant. Côté client = crash navigateur ; expose des internes serveur.`,
    fix: s('Déplace dans server/api/ ou utilise #imports pour les utils réservés au serveur.'),
  },
}

const catalog: Record<Lang, Record<string, Entry>> = { en, fr }

export function t(lang: Lang, key: string, params: Params = {}): Localized {
  const entry = catalog[lang]?.[key] ?? en[key]
  if (!entry) throw new Error(`i18n: unknown message key "${key}"`)
  return { message: entry.message(params), fix: entry.fix(params) }
}

// --- UI chrome --------------------------------------------------------------

interface Ui {
  health: string
  score: string
  files: string
  time: string
  noIssues: string
  issue: string
  issues: string
  categories: Record<Category, string>
}

const ui: Record<Lang, Ui> = {
  en: {
    health: 'codebase health',
    score: 'score',
    files: 'files',
    time: 'time',
    noIssues: 'No issues found.',
    issue: 'issue',
    issues: 'issues',
    categories: {
      security: 'SECURITY',
      correctness: 'CORRECTNESS',
      performance: 'PERFORMANCE',
      architecture: 'ARCHITECTURE',
      composition: 'COMPOSITION',
    },
  },
  fr: {
    health: 'santé du code',
    score: 'score',
    files: 'fichiers',
    time: 'temps',
    noIssues: 'Aucun problème trouvé.',
    issue: 'problème',
    issues: 'problèmes',
    categories: {
      security: 'SÉCURITÉ',
      correctness: 'CORRECTION',
      performance: 'PERFORMANCE',
      architecture: 'ARCHITECTURE',
      composition: 'COMPOSITION',
    },
  },
}

export function uiStrings(lang: Lang): Ui {
  return ui[lang] ?? ui.en
}

/** Resolve language: explicit flag > config > system locale > 'en'. */
export function resolveLang(flag?: string, configLang?: string): Lang {
  const pick = (v?: string): Lang | undefined =>
    v === 'fr' || v === 'en' ? v : undefined
  if (pick(flag)) return pick(flag)!
  if (pick(configLang)) return pick(configLang)!
  const locale = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || ''
  if (/^fr/i.test(locale)) return 'fr'
  return 'en'
}
