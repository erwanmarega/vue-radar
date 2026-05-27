import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

const ACTION_YML = `name: vue-radar

on:
  pull_request:
    paths:
      - '**/*.vue'
      - '**/*.ts'
      - '**/*.js'

jobs:
  vue-radar:
    name: Vue codebase health
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run vue-radar
        id: scan
        run: |
          npx vue-radar@latest --json --fail-on error > vue-radar-report.json || true
          echo "score=$(node -e "const r=require('./vue-radar-report.json'); console.log(r.score)")" >> $GITHUB_OUTPUT
          echo "errors=$(node -e "const r=require('./vue-radar-report.json'); console.log(r.diagnostics.filter(d=>d.severity==='error').length)")" >> $GITHUB_OUTPUT

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('vue-radar-report.json', 'utf8'));
            const score = report.score;
            const scoreBar = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
            const diags = report.diagnostics;

            const rows = diags.map(d => {
              const sev = d.severity === 'error' ? '🔴' : d.severity === 'warning' ? '🟡' : 'ℹ️';
              return \`| \${sev} | \${d.file}\${d.line ? ':' + d.line : ''} | \${d.message} |\`;
            }).join('\\n');

            const body = [
              \`## \${scoreBar} vue-radar — \${score}/100\`,
              '',
              \`Scanned \${report.files} file(s) in \${report.duration}ms\`,
              '',
              diags.length > 0 ? [
                '| | File | Issue |',
                '|---|---|---|',
                rows,
              ].join('\\n') : '✅ No issues found.',
            ].join('\\n');

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            const existing = comments.find(c => c.body.includes('vue-radar'));
            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: vue-radar-report
          path: vue-radar-report.json

      - name: Fail on errors
        if: steps.scan.outputs.errors != '0'
        run: |
          echo "vue-radar found \${{ steps.scan.outputs.errors }} error(s). Score: \${{ steps.scan.outputs.score }}/100"
          exit 1
`

export function initAction(dir: string): void {
  const workflowDir = join(dir, '.github', 'workflows')
  const workflowPath = join(workflowDir, 'vue-radar.yml')

  console.log()
  console.log(chalk.bold('  vue-radar') + chalk.dim(' — GitHub Action setup'))
  console.log()

  if (existsSync(workflowPath)) {
    console.log(`  ${chalk.yellow('!')} ${workflowPath} already exists. Delete it first to regenerate.`)
    console.log()
    return
  }

  mkdirSync(workflowDir, { recursive: true })
  writeFileSync(workflowPath, ACTION_YML)

  console.log(`  ${chalk.green('✓')} Workflow created → ${chalk.dim(workflowPath)}`)
  console.log()
  console.log(`  ${chalk.dim('What it does:')}`)
  console.log(`    • Runs on every PR that touches .vue / .ts / .js files`)
  console.log(`    • Posts a sticky comment with score + issue table`)
  console.log(`    • Fails CI if any errors found`)
  console.log(`    • Uploads JSON report as artifact`)
  console.log()
  console.log(`  ${chalk.dim('Commit with:')} git add .github && git commit -m "ci: add vue-radar health check"`)
  console.log()
}
