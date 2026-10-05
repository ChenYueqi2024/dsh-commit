/**
 * dsh-commit: one tool, `git_commit_message`, that reads the staged git diff
 * and generates a conventional Chinese commit message through one auxiliary
 * LLM call. The plugin never runs git commit itself — the model executes the
 * commit with its own shell tool, keeping the permission pipeline intact.
 * @module dsh-commit
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'
import type { GenerateOptions } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const name = 'dsh-commit'
export const inject = ['tools', 'llm'] as const

export interface Config {
  provider: string
  model: string
  /** Maximum diff characters sent to the model. */
  maxDiffChars: number
  timeoutMs: number
}

export const Config: z<Config> = z.object({
  provider: z.string().default('deepseek-official'),
  model: z.string().default('deepseek-flash'),
  maxDiffChars: z.number().step(1).min(1000).default(12000),
  timeoutMs: z.number().step(1).min(1000).default(120000),
})

const SYSTEM = [
  '你是 commit message 生成器。根据 git 暂存区 diff 生成一条中文的约定式提交（Conventional Commits）。',
  '格式：第一行 `类型(范围): 主题`，类型从 feat/fix/docs/refactor/test/chore 中选择；空一行后写正文，说明动机与影响，正文可省略。',
  '主题不超过 50 字，使用祈使句风格，不加句号。只输出 commit message 本身，不要任何解释或代码块围栏。',
].join('\n')

export function apply(ctx: Context, config: Config): void {
  ctx.tools.register(defineTool({
    name: 'git_commit_message',
    description: 'Generate a conventional Chinese commit message from the STAGED git changes (git diff --cached). '
      + 'The tool never commits by itself: review the returned message, then run `git commit` with your shell tool.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          stagedFiles: { type: 'integer', required: true },
          message: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `已暂存 ${value.stagedFiles} 个文件。建议的 commit message：\n${value.message}\n（请审阅后用你的 shell 工具执行 git commit）`,
      }],
    },
    async execute(_args, exec) {
      const cwd = exec.agent?.session?.header?.cwd ?? process.cwd()
      let diff: string
      let stagedFiles: number
      try {
        diff = (await run('git', ['diff', '--cached'], { cwd, maxBuffer: 32 * 1024 * 1024 })).stdout
        const stat = (await run('git', ['diff', '--cached', '--stat'], { cwd, maxBuffer: 1024 * 1024 })).stdout
        stagedFiles = stat.split('\n').filter(line => line.includes('|')).length
      } catch (error) {
        throw new Error(`读取暂存区失败（是否为 git 仓库、是否有暂存内容？）：${error instanceof Error ? error.message : String(error)}`)
      }
      if (diff.trim().length === 0) {
        throw new Error('暂存区为空：先 `git add` 再调用本工具')
      }
      const truncated = diff.length > config.maxDiffChars
        ? diff.slice(0, config.maxDiffChars) + '\n...(diff 已截断)'
        : diff
      const message = await generate(ctx, config, cwd, truncated)
      return { stagedFiles, message }
    },
    presentCall: () => ({ card: 'generic', title: '生成 commit message', kind: 'other', rawInput: {} }),
  }))
}

async function generate(ctx: Context, config: Config, cwd: string, diff: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const options: GenerateOptions = Object.freeze({
      provider: config.provider,
      model: config.model,
      messages: [createUserMessage({
        content: [{ type: 'text', text: `工作目录：${cwd}\n\nstaged diff：\n${diff}` }],
        source: { kind: 'dsh-commit-generate' } as never,
      })],
      system: SYSTEM,
      maxTokens: 512,
      sessionId: undefined,
      purpose: 'dsh-commit-generate',
      signal: controller.signal,
    })
    const assembler = new BlockAssembler()
    for await (const chunk of (ctx.llm as any).stream(options)) assembler.push(chunk)
    const text = (assembler.blocks() ?? [])
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join(' ')
      .trim()
    if (text.length === 0) throw new Error('模型未返回内容')
    return text.replace(/^```[a-z]*\n?|```$/g, '').trim()
  } finally {
    clearTimeout(timer)
  }
}
