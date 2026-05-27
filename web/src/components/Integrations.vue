<template>
  <section class="section">
    <div class="container">
      <div class="section-head">
        <span class="section-num">03</span>
        <h2>Integrations</h2>
      </div>

      <div class="grid">
        <div v-for="item in items" :key="item.name" class="card">
          <div class="card-top">
            <span class="card-name">{{ item.name }}</span>
            <span class="card-tag" :class="item.tag">{{ item.tag }}</span>
          </div>
          <p class="card-desc">{{ item.desc }}</p>
          <div class="card-cmd">
            <span class="prompt">$</span> {{ item.cmd }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const items = [
  {
    name: 'Claude Code',
    tag: 'agent',
    desc: 'Installs as /vue-radar slash command. Agents auto-run scan before PRs.',
    cmd: 'npx vue-radar@latest install --agent claude-code',
  },
  {
    name: 'Cursor',
    tag: 'agent',
    desc: 'Appends rules to .cursorrules. Cursor checks before committing.',
    cmd: 'npx vue-radar@latest install --agent cursor',
  },
  {
    name: 'GitHub Actions',
    tag: 'ci',
    desc: 'Sticky PR comment with score + table. Fails pipeline on errors.',
    cmd: 'npx vue-radar@latest init-action',
  },
  {
    name: 'Codex / OpenCode',
    tag: 'agent',
    desc: 'Writes rules to AGENTS.md. Agent reads before editing Vue files.',
    cmd: 'npx vue-radar@latest install --agent codex',
  },
  {
    name: 'Nuxt 3',
    tag: 'auto',
    desc: 'Detected via nuxt.config.ts. Adds 5 Nuxt-specific rules automatically.',
    cmd: 'npx vue-radar@latest  # auto',
  },
  {
    name: 'Pre-commit hook',
    tag: 'ci',
    desc: 'Scan only staged files before every commit. Exit 1 on errors.',
    cmd: 'npx vue-radar@latest --diff --fail-on warning',
  },
]
</script>

<style scoped>
.section { padding: 72px 0; border-bottom: 1px solid var(--border); }

.section-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 28px;
}
.section-num { font-size: 0.72rem; color: var(--muted); letter-spacing: 0.1em; }
h2 { font-size: 1.3rem; font-weight: 700; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.card {
  padding: 20px;
  background: var(--bg);
  transition: background 0.1s;
}
.card:hover { background: var(--surface); }

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-name { font-size: 0.88rem; font-weight: 600; color: var(--text); }

.card-tag {
  font-size: 0.65rem;
  padding: 2px 7px;
  border-radius: 3px;
  letter-spacing: 0.05em;
}
.card-tag.agent { background: #1a2d1a; color: var(--green); border: 1px solid var(--green-dim); }
.card-tag.ci    { background: #1a1a2d; color: var(--blue);  border: 1px solid #1a2040; }
.card-tag.auto  { background: #2d1a1a; color: var(--orange); border: 1px solid #3d2010; }

.card-desc {
  color: var(--muted);
  font-size: 0.76rem;
  line-height: 1.6;
  margin-bottom: 14px;
}

.card-cmd {
  background: #0a0a0a;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 7px 10px;
  font-size: 0.72rem;
  color: var(--text);
  word-break: break-all;
}
.prompt { color: var(--green); margin-right: 6px; }
</style>
