<template>
  <section class="hero">
    <div class="container">

      <p class="tagline">{{ t('hero.tagline') }}</p>

      <h1>{{ t('hero.title.l1') }}<br />{{ t('hero.title.l2') }}</h1>

      <p class="desc">
        {{ t('hero.desc.l1') }}<br />
        {{ t('hero.desc.l2') }}
      </p>

      <!-- mini terminal -->
      <div class="term">
        <div class="term-line">
          <span class="g">~/project</span>
          <span class="w"> $ npx vue-radar@latest</span>
        </div>
        <div class="term-spacer"></div>
        <div v-for="(line, i) in visible" :key="i" class="term-line output">
          <span v-for="(p, j) in line" :key="j" :class="p.c">{{ p.t }}</span>
        </div>
        <div v-if="scoreVisible" class="term-line output score-line">
          <span class="dim">  score  </span>
          <span class="bar-wrap">
            <span class="bar-track">████████████████</span>
            <span class="bar-fill" :style="{ width: scoreFill + '%' }">████████████████</span>
          </span>
          <span class="score-val">  {{ scoreNum }}/100</span>
        </div>
        <div v-if="showCursor" class="term-line"><span class="cursor">█</span></div>
      </div>

      <!-- install cta -->
      <div class="cta">
        <code>npx vue-radar@latest</code>
        <span class="muted">{{ t('hero.cta.or') }}</span>
        <code>npx vue-radar@latest install</code>
        <span class="muted">{{ t('hero.cta.skill') }}</span>
      </div>

      <!-- integrations row -->
      <div class="badges">
        <span>Vue 3</span>
        <span>Nuxt 3</span>
        <span>Vite</span>
        <span>Claude Code</span>
        <span>Cursor</span>
        <span>GitHub Actions</span>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

type Part = { t: string; c?: string }

const LINES: Part[][] = [
  [{ t: '  ✖ ', c: 'err' }, { t: 'LoginForm.vue:42  ', c: 'dim' }, { t: '[v-html-unsafe]', c: 'rule' }],
  [{ t: '    → ', c: 'dim' }, { t: 'sanitize with DOMPurify', c: 'fix' }],
  [{ t: '' }],
  [{ t: '  ⚠ ', c: 'warn' }, { t: 'UserList.vue:17   ', c: 'dim' }, { t: '[missing-key-in-v-for]', c: 'rule' }],
  [{ t: '' }],
]

const SCORE = 74

const visible = ref<Part[][]>([])
const showCursor = ref(true)
const scoreVisible = ref(false)
const scoreFill = ref(0)
const scoreNum = ref(0)

function animateScore() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    scoreFill.value = SCORE
    scoreNum.value = SCORE
    showCursor.value = false
    return
  }
  // bar width is CSS-transitioned; flip it on next frame so the transition runs
  requestAnimationFrame(() => { scoreFill.value = SCORE })
  // count the number up in step with the bar (~1s)
  const duration = 1000
  const start = performance.now()
  const tickNum = (now: number) => {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
    scoreNum.value = Math.round(eased * SCORE)
    if (p < 1) {
      requestAnimationFrame(tickNum)
    } else {
      showCursor.value = false
    }
  }
  requestAnimationFrame(tickNum)
}

onMounted(() => {
  let i = 0
  const tick = () => {
    if (i < LINES.length) {
      visible.value.push(LINES[i++])
      setTimeout(tick, i < 3 ? 220 : 100)
    } else {
      scoreVisible.value = true
      setTimeout(animateScore, 120)
    }
  }
  setTimeout(tick, 700)
})
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 96px 0 80px;
  border-bottom: 1px solid var(--border);
}

/* soft pulsing glow behind the headline */
.hero::before {
  content: '';
  position: absolute;
  top: -160px;
  left: 50%;
  width: 620px;
  height: 420px;
  transform: translateX(-50%);
  background: radial-gradient(circle at center, rgba(61, 220, 132, 0.12), transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: glow-pulse 6s ease-in-out infinite;
}

.hero .container {
  position: relative;
  z-index: 1;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}

/* staggered entrance on load */
.tagline,
h1,
.desc,
.term,
.cta,
.badges {
  opacity: 0;
  animation: fade-up 0.6s ease forwards;
}

.tagline { animation-delay: 0.05s; }
h1       { animation-delay: 0.15s; }
.desc    { animation-delay: 0.28s; }
.term    { animation-delay: 0.40s; }
.cta     { animation-delay: 0.52s; }
.badges  { animation-delay: 0.62s; }

.tagline {
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 20px;
  letter-spacing: 0.04em;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #e2e2e2;
  margin-bottom: 20px;
}

.desc {
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.8;
  margin-bottom: 48px;
}

/* terminal */
.term {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 18px 20px;
  background: #090909;
  margin-bottom: 32px;
  min-height: 60px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.term:hover {
  border-color: #2c2c2c;
  box-shadow: 0 0 0 1px rgba(61, 220, 132, 0.12);
}

/* each result line eases in as it's appended */
.term-line.output {
  animation: fade-up 0.3s ease backwards;
}

.term-line {
  display: block;
  font-size: 0.78rem;
  line-height: 1.7;
}

.term-spacer { height: 6px; }

.g    { color: var(--green); }
.w    { color: var(--text); }
.dim  { color: var(--muted); }
.err  { color: var(--red); }
.warn { color: var(--yellow); }
.rule { color: var(--purple); }
.fix  { color: var(--green); }
.score-val { color: var(--green); font-weight: 700; }

/* animated score bar — green fill grows over a grey track */
.score-line { white-space: nowrap; }

.bar-wrap {
  position: relative;
  display: inline-block;
  letter-spacing: -0.01em;
  vertical-align: bottom;
}

.bar-track { color: #2a2a2a; }

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  color: var(--green);
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.cursor {
  color: var(--green);
  animation: blink 1s step-end infinite;
}
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }

/* cta */
.cta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  font-size: 0.75rem;
}

code {
  background: #141414;
  border: 1px solid var(--border);
  padding: 3px 10px;
  border-radius: 4px;
  color: var(--green);
}

.muted { color: var(--muted); }

/* badges */
.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badges span {
  font-size: 0.67rem;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 3px;
  letter-spacing: 0.03em;
  transition: color 0.18s ease, border-color 0.18s ease;
}

.badges span:hover {
  color: var(--text);
  border-color: #383838;
}

@media (prefers-reduced-motion: reduce) {
  .tagline, h1, .desc, .term, .cta, .badges,
  .term-line.output { opacity: 1; }
}
</style>
