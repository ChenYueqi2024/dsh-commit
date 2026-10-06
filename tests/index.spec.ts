import { describe, expect, it } from 'vitest'
import { cleanMessage, truncateDiff, gitErrorHint } from '../src/index.ts'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = promisify(execFile)

describe('cleanMessage', () => {
  it('strips markdown code fences', () => {
    expect(cleanMessage('```\nfeat(x): 新增功能\n```')).toBe('feat(x): 新增功能')
    expect(cleanMessage('```bash\nfix(y): 修复问题\n```')).toBe('fix(y): 修复问题')
  })

  it('keeps plain output intact', () => {
    expect(cleanMessage('docs: 更新文档')).toBe('docs: 更新文档')
  })
})

describe('truncateDiff', () => {
  it('keeps short diffs untouched', () => {
    expect(truncateDiff('abc', 100)).toBe('abc')
  })

  it('truncates long diffs with a marker', () => {
    const out = truncateDiff('x'.repeat(300), 100)
    expect(out.startsWith('x'.repeat(100))).toBe(true)
    expect(out).toContain('...(diff 已截断)')
  })
})

describe('gitErrorHint', () => {
  it('explains the non-git-directory case', () => {
    const hint = gitErrorHint('Command failed: git diff --cached\nfatal: not a git repository (or any of the parent directories): .git', 'D:/somewhere')
    expect(hint).toContain('不是 git 仓库')
  })

  it('explains the empty-repository case', () => {
    const hint = gitErrorHint("fatal: ambiguous argument 'HEAD'", 'D:/somewhere')
    expect(hint).toContain('git add')
  })

  it('passes through unknown failures', () => {
    expect(gitErrorHint('some other failure', 'D:/x')).toContain('some other failure')
  })
})
