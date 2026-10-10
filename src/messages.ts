/**
 * Pure helpers for dsh-commit: commit-message cleanup, diff capping, and git
 * error mapping. Deliberately dependency-free so unit tests can import them
 * without the dsh runtime (the @deepseek-ai/* packages only exist inside a
 * host dsh installation — importing src/index.ts from a test would fail in
 * any clean environment, e.g. CI).
 * @module dsh-commit/messages
 */

/** Extract the conventional-commit message from model output (strip fences/prose). */
export function cleanMessage(text: string): string {
  return text.replace(/^```[a-z]*\n?|```$/g, '').trim()
}

/** Map a raw git failure to an actionable Chinese hint. */
export function gitErrorHint(raw: string, cwd: string): string {
  if (raw.includes('not a git repository')) return `当前目录 ${cwd} 不是 git 仓库：先 git init / cd 到仓库目录`
  if (raw.includes('does not have any commits yet') || raw.includes('ambiguous argument')) return '仓库还没有任何提交且暂存区读取失败：先 git add 文件'
  return `读取暂存区失败：${raw}`
}

/** Cap a large staged diff for the model call. */
export function truncateDiff(diff: string, maxChars: number): string {
  return diff.length > maxChars ? diff.slice(0, maxChars) + '\n...(diff 已截断)' : diff
}
