<template>
  <section class="hero">
    <div class="container">

      <p class="tagline">Catch bad Vue before it ships.</p>

      <h1>Static analysis<br />for Vue.js codebases.</h1>

      <p class="desc">
        24 rules across security, correctness, performance,<br />
        architecture, and composition. Zero config.
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
        <div v-if="showCursor" class="term-line"><span class="cursor">█</span></div>
      </div>

      <!-- install cta -->
      <div class="cta">
        <code>npx vue-radar@latest</code>
        <span class="muted">or</span>
        <code>npx vue-radar@latest install</code>
        <span class="muted">for agent skill</span>
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

type Part = { t: string; c?: string }

const LINES: Part[][] = [
  [{ t: '  ✖ ', c: 'err' }, { t: 'LoginForm.vue:42  ', c: 'dim' }, { t: '[v-html-unsafe]', c: 'rule' }],
  [{ t: '    → ', c: 'dim' }, { t: 'sanitize with DOMPurify', c: 'fix' }],
  [{ t: '' }],
  [{ t: '  ⚠ ', c: 'warn' }, { t: 'UserList.vue:17   ', c: 'dim' }, { t: '[missing-key-in-v-for]', c: 'rule' }],
  [{ t: '' }],
  [{ t: '  score  ' , c: 'dim' }, { t: '████████████░░░░', c: 'bar' }, { t: '  74/100', c: 'score' }],
]

const visible = ref<Part[][]>([])
const showCursor = ref(true)

onMounted(() => {
  let i = 0
  const tick = () => {
    if (i < LINES.length) {
      visible.value.push(LINES[i++])
      setTimeout(tick, i < 3 ? 220 : 100)
    } else {
      showCursor.value = false
    }
  }
  setTimeout(tick, 700)
})
</script>

<style scoped>
.hero {
  padding: 96px 0 80px;
  border-bottom: 1px solid var(--border);
}

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
.score { color: var(--green); font-weight: 700; }
.bar {
  background: linear-gradient(90deg, var(--green) 75%, #2a2a2a 75%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
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
}
</style>
