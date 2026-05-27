import { vHtmlUnsafe, dynamicHrefBinding } from './security'
import { vIfVForSameElement, missingKeyInVFor, missingDotValue, directReactiveMutation } from './correctness'
import { noAsyncComponent, inlineComplexHandler, missingShallowRef, vForWithIndex } from './performance'
import { missingDefineEmits, missingDefineProps, componentTooLarge, noExplicitAny, missingExpose } from './architecture'
import { watchMissingCleanup, sideEffectInComputed, lifecycleInSetup, missingOnUnmounted } from './composition'
import {
  nuxtUseFetchOutsideSetup,
  nuxtMissingPageMeta,
  nuxtUseRouteOutsideSetup,
  nuxtFetchWithoutErrorHandling,
  nuxtServerOnlyInClient,
} from './nuxt'
import type { Rule } from '../types'

export const coreRules: Rule[] = [
  vHtmlUnsafe,
  dynamicHrefBinding,
  vIfVForSameElement,
  missingKeyInVFor,
  missingDotValue,
  directReactiveMutation,
  noAsyncComponent,
  inlineComplexHandler,
  missingShallowRef,
  vForWithIndex,
  missingDefineEmits,
  missingDefineProps,
  componentTooLarge,
  noExplicitAny,
  missingExpose,
  watchMissingCleanup,
  sideEffectInComputed,
  lifecycleInSetup,
  missingOnUnmounted,
]

export const nuxtRules: Rule[] = [
  nuxtUseFetchOutsideSetup,
  nuxtMissingPageMeta,
  nuxtUseRouteOutsideSetup,
  nuxtFetchWithoutErrorHandling,
  nuxtServerOnlyInClient,
]

export const allRules: Rule[] = [...coreRules, ...nuxtRules]

export function filterRules(rules: Rule[], only?: string[], skip?: string[]): Rule[] {
  let result = rules
  if (only && only.length > 0) {
    result = result.filter(r => only.includes(r.id))
  }
  if (skip && skip.length > 0) {
    result = result.filter(r => !skip.includes(r.id))
  }
  return result
}
