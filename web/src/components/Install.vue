<template>
  <section id="install" class="section">
    <div class="container">
      <div class="section-head">
        <span class="section-num">01</span>
        <h2>Install</h2>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: active === tab.id }"
          @click="active = tab.id"
        >{{ tab.label }}</button>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">bash</span>
          <button class="copy-btn" @click="copy(activetab.code)">
            {{ copied ? 'copied!' : 'copy' }}
          </button>
        </div>
        <pre><code>{{ activetab.code }}</code></pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const active = ref('cli')
const copied = ref(false)

const tabs = [
  {
    id: 'cli',
    label: 'CLI',
    code: `# scan entire project
$ npx vue-radar@latest

# scan only changed files (git diff vs main)
$ npx vue-radar@latest --diff

# JSON output
$ npx vue-radar@latest --json

# only specific rules
$ npx vue-radar@latest --rule v-html-unsafe,missing-key-in-v-for

# exit 1 on warnings too
$ npx vue-radar@latest --fail-on warning`,
  },
  {
    id: 'agent',
    label: 'Agent skill',
    code: `# auto-detects your agent (Claude Code, Cursor, Codex)
$ npx vue-radar@latest install

# or specify
$ npx vue-radar@latest install --agent claude-code
$ npx vue-radar@latest install --agent cursor
$ npx vue-radar@latest install --agent codex`,
  },
  {
    id: 'ci',
    label: 'GitHub Actions',
    code: `# generates .github/workflows/vue-radar.yml
$ npx vue-radar@latest init-action

# what it does:
#   runs on every PR touching .vue / .ts / .js
#   posts sticky comment: score + issue table
#   fails CI on errors
#   uploads JSON report as artifact`,
  },
  {
    id: 'nuxt',
    label: 'Nuxt',
    code: `# auto-detected when nuxt.config.ts is present
# no config needed — just run:
$ npx vue-radar@latest

# activates 5 extra rules:
#   nuxt-usefetch-outside-setup    error
#   nuxt-use-route-outside-setup   error
#   nuxt-server-import-in-client   error
#   nuxt-fetch-no-error-handling   warning
#   nuxt-missing-page-meta         info`,
  },
]

const activetab = computed(() => tabs.find(t => t.id === active.value)!)

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
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
  margin-bottom: 32px;
}

.section-num {
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.1em;
}

h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: -1px;
}

.tab {
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 8px 16px;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.78rem;
  transition: color 0.1s, border-color 0.1s;
  margin-bottom: -1px;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--green); border-bottom-color: var(--green); }

.code-block {
  border: 1px solid var(--border);
  border-radius: 0 6px 6px 6px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.code-lang {
  font-size: 0.7rem;
  color: var(--muted);
}

.copy-btn {
  background: none;
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 3px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.7rem;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
}
.copy-btn:hover { color: var(--text); border-color: var(--dim); }

pre {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  background: #0a0a0a;
}

code {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: var(--text);
  line-height: 1.8;
}
</style>
