import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseVueFile } from './parser'
import type { Diagnostic, Rule } from './types'
import { vHtmlUnsafe, dynamicHrefBinding } from './rules/security'
import { vIfVForSameElement, missingKeyInVFor, missingDotValue, directReactiveMutation } from './rules/correctness'
import { noAsyncComponent, inlineComplexHandler, missingShallowRef, vForWithIndex } from './rules/performance'
import { missingDefineEmits, missingDefineProps, componentTooLarge, noExplicitAny, missingExpose } from './rules/architecture'
import { watchMissingCleanup, sideEffectInComputed, lifecycleInSetup, missingOnUnmounted } from './rules/composition'
import {
  nuxtUseFetchOutsideSetup,
  nuxtMissingPageMeta,
  nuxtUseRouteOutsideSetup,
  nuxtFetchWithoutErrorHandling,
  nuxtServerOnlyInClient,
} from './rules/nuxt'

function runRule(rule: Rule, source: string, filename = 'Comp.vue'): Diagnostic[] {
  const parsed = parseVueFile(source)
  const out: Diagnostic[] = []
  rule.check({
    filename,
    source,
    sfc: parsed.sfc,
    scriptAst: parsed.scriptAst,
    templateAst: parsed.templateAst,
    report: d => out.push({ ...d, file: filename }),
  })
  return out
}

/** Assert the rule fires on `bad` and stays silent on `good`. */
function expectRule(rule: Rule, bad: string, good: string, filename?: string) {
  assert.ok(runRule(rule, bad, filename).length > 0, `${rule.id}: expected a diagnostic on bad input`)
  assert.equal(runRule(rule, good, filename).length, 0, `${rule.id}: expected no diagnostic on good input`)
}

const setup = (body: string) => `<template><div/></template>\n<script setup lang="ts">\n${body}\n</script>`
const optionsApi = (body: string) => `<template><div/></template>\n<script lang="ts">\nexport default {\n${body}\n}\n</script>`

// --- security ---------------------------------------------------------------

test('v-html-unsafe', () => {
  expectRule(
    vHtmlUnsafe,
    `<template><p v-html="raw"></p></template>`,
    `<template><p>{{ raw }}</p></template>`,
  )
})

test('dynamic-href-unsafe', () => {
  expectRule(
    dynamicHrefBinding,
    `<template><a :href="userUrl">x</a></template>`,
    `<template><a href="/static">x</a></template>`,
  )
})

// --- correctness ------------------------------------------------------------

test('v-if-v-for-same-element', () => {
  expectRule(
    vIfVForSameElement,
    `<template><li v-for="i in items" v-if="i.ok">{{ i }}</li></template>`,
    `<template><li v-for="i in items" :key="i.id">{{ i }}</li></template>`,
  )
})

test('missing-key-in-v-for', () => {
  expectRule(
    missingKeyInVFor,
    `<template><li v-for="i in items">{{ i }}</li></template>`,
    `<template><li v-for="i in items" :key="i.id">{{ i }}</li></template>`,
  )
})

test('missing-dot-value fires on ref reassign, not on declaration', () => {
  expectRule(
    missingDotValue,
    setup(`import { ref } from 'vue'\nconst count = ref(0)\nfunction inc() { count = 5 }`),
    setup(`import { ref } from 'vue'\nconst count = ref(0)\nfunction inc() { count.value = 5 }`),
  )
})

test('missing-dot-value ignores non-ref assignment', () => {
  assert.equal(
    runRule(missingDotValue, setup(`import { ref } from 'vue'\nconst count = ref(0)\nlet plain = 1\nplain = 2`)).length,
    0,
  )
})

test('direct-reactive-mutation fires on replace, not on property set', () => {
  expectRule(
    directReactiveMutation,
    setup(`import { reactive } from 'vue'\nconst state = reactive({ a: 1 })\nfunction r() { state = { a: 2 } }`),
    setup(`import { reactive } from 'vue'\nconst state = reactive({ a: 1 })\nfunction r() { state.a = 2 }`),
  )
})

// --- performance ------------------------------------------------------------

test('no-async-component', () => {
  expectRule(
    noAsyncComponent,
    setup(`import Heavy from './Heavy.vue'`),
    setup(`import { ref } from 'vue'`),
  )
})

test('inline-complex-handler', () => {
  expectRule(
    inlineComplexHandler,
    `<template><button @click="doThing(); doOther(); andAnotherLongThing()">x</button></template>`,
    `<template><button @click="onClick">x</button></template>`,
  )
})

test('missing-shallow-ref fires on object/array, not primitive', () => {
  expectRule(
    missingShallowRef,
    setup(`import { ref } from 'vue'\nconst big = ref({ a: 1, b: 2 })`),
    setup(`import { ref } from 'vue'\nconst n = ref(0)`),
  )
})

test('v-for-index-as-key', () => {
  expectRule(
    vForWithIndex,
    `<template><li v-for="(item, index) in items" :key="index">{{ item }}</li></template>`,
    `<template><li v-for="(item, index) in items" :key="item.id">{{ item }}</li></template>`,
  )
})

// --- architecture -----------------------------------------------------------

test('missing-define-emits', () => {
  expectRule(
    missingDefineEmits,
    setup(`function send() { emit('change', 1) }`),
    setup(`const emit = defineEmits<{ change: [n: number] }>()\nfunction send() { emit('change', 1) }`),
  )
})

test('missing-define-props', () => {
  expectRule(
    missingDefineProps,
    setup(`const title = props.title`),
    setup(`const props = defineProps<{ title: string }>()\nconst title = props.title`),
  )
})

test('component-too-large', () => {
  const big = `<template><div/></template>\n<script setup>\n${'const x = 1\n'.repeat(260)}</script>`
  assert.ok(runRule(componentTooLarge, big).length > 0)
  assert.equal(runRule(componentTooLarge, setup(`const x = 1`)).length, 0)
})

test('no-explicit-any fires on type, ignores comment and string', () => {
  expectRule(
    noExplicitAny,
    setup(`const data: any = load()`),
    setup(`// returns any value historically\nconst msg = 'any'\nconst data: unknown = load()`),
  )
})

test('missing-expose', () => {
  expectRule(
    missingExpose,
    `<template><input ref="field" /></template>\n<script setup>\nconst x = 1\n</script>`,
    `<template><input ref="field" /></template>\n<script setup>\ndefineExpose({ focus() {} })\n</script>`,
  )
})

// --- composition ------------------------------------------------------------

test('watch-missing-cleanup fires without cleanup, silent with AbortController', () => {
  expectRule(
    watchMissingCleanup,
    setup(`import { watch } from 'vue'\nwatch(id, async () => { await fetch('/x') })`),
    setup(`import { watch } from 'vue'\nwatch(id, async (v, o, onCleanup) => { const c = new AbortController(); onCleanup(() => c.abort()); await fetch('/x', { signal: c.signal }) })`),
  )
})

test('watch-missing-cleanup silent when no fetch', () => {
  assert.equal(
    runRule(watchMissingCleanup, setup(`import { watch } from 'vue'\nwatch(id, () => { total.value++ })`)).length,
    0,
  )
})

test('side-effect-in-computed', () => {
  expectRule(
    sideEffectInComputed,
    setup(`import { computed } from 'vue'\nconst c = computed(() => { console.log('x'); return a.value + 1 })`),
    setup(`import { computed } from 'vue'\nconst c = computed(() => a.value + 1)`),
  )
})

test('lifecycle-outside-setup (options API)', () => {
  expectRule(
    lifecycleInSetup,
    optionsApi(`created() { onMounted(() => {}) }`),
    optionsApi(`setup() { onMounted(() => {}) }`),
  )
})

test('lifecycle-outside-setup never fires in <script setup>', () => {
  assert.equal(
    runRule(lifecycleInSetup, setup(`import { onMounted } from 'vue'\nonMounted(() => {})`)).length,
    0,
  )
})

test('missing-on-unmounted-cleanup', () => {
  expectRule(
    missingOnUnmounted,
    setup(`window.addEventListener('resize', onResize)`),
    setup(`window.addEventListener('resize', onResize)\nimport { onUnmounted } from 'vue'\nonUnmounted(() => window.removeEventListener('resize', onResize))`),
  )
})

// --- nuxt -------------------------------------------------------------------

test('nuxt-usefetch-outside-setup (options API)', () => {
  expectRule(
    nuxtUseFetchOutsideSetup,
    optionsApi(`created() { const d = useFetch('/api') }`),
    optionsApi(`setup() { const d = useFetch('/api') }`),
  )
})

test('nuxt-missing-page-meta', () => {
  expectRule(
    nuxtMissingPageMeta,
    setup(`const x = 1`),
    setup(`definePageMeta({ title: 'X' })`),
    'pages/index.vue',
  )
})

test('nuxt-use-route-outside-setup (options API)', () => {
  expectRule(
    nuxtUseRouteOutsideSetup,
    optionsApi(`created() { const r = useRoute() }`),
    optionsApi(`setup() { const r = useRoute() }`),
  )
})

test('nuxt-fetch-no-error-handling', () => {
  expectRule(
    nuxtFetchWithoutErrorHandling,
    setup(`const { data } = useFetch('/api')`),
    setup(`const { data, error } = useFetch('/api')`),
  )
})

test('nuxt-server-import-in-client', () => {
  expectRule(
    nuxtServerOnlyInClient,
    setup(`import fs from 'fs'`),
    setup(`import { ref } from 'vue'`),
  )
})
