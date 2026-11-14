# 🐳 dsh-commit

[下载 v0.2.2](https://github.com/ChenYueqi2024/dsh-commit/releases/tag/v0.2.2) · [配套插件 dsh-memory](https://github.com/ChenYueqi2024/dsh-memory)

**暂存你想提交的改动，让 dsh 生成一条中文提交说明，核对后亲手提交。**

dsh-commit 是 DeepSeek Harness 的工具插件。它把 Git 暂存区里的差异交给当前配置的模型，起草一条约定式提交信息。例如，给项目补了一页测试指南，建议就可能是 `docs: 补充本地测试说明`。

| 改动 | 可能生成的说明 |
|---|---|
| 📝 补上本地测试步骤 | `docs: 补充本地测试说明` |
| 🐛 修复登录页的错误提示 | `fix(auth): 修正登录失败提示` |
| ✨ 为导出页面增加 CSV 选项 | `feat(export): 支持导出 CSV` |

## 🚀 安装并启用

准备好 Git、DeepSeek Harness 和可用的模型路由，并确保 dsh 启动时能找到 pnpm。本项目的运行时验证使用 **dsh 0.2.0-rc.2**。[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)

1. 下载 [dsh-commit-0.2.2.tgz](https://github.com/ChenYueqi2024/dsh-commit/releases/download/v0.2.2/dsh-commit-0.2.2.tgz) 到运行 dsh 的机器。
2. 在 dsh 网页打开 **插件 → 添加插件**，输入压缩包的完整路径，例如 `D:/Downloads/dsh-commit-0.2.2.tgz`。
3. 安装完成后启用 **dsh-commit**，把会话的工作区切到你的 Git 仓库。

## 📝 跟着做一遍：补一页测试指南

假设你给一个通过 `npm test` 跑测试的项目新建了 `docs/testing.md`，内容如下。

```markdown
# 本地测试

准备好项目依赖后，在仓库根目录运行 `npm test`。
```

### 1. 暂存本次改动

在**同一个 Git 仓库**的终端运行：

```bash
git status --short
git add -- docs/testing.md
git diff --cached
```

`git add` 把这个文件当前的改动放入暂存区。查看 `git diff --cached`，确认里面都是你想一起提交的内容。如果刚暂存的文件后来又改过，重新暂存后再生成说明。

### 2. 让插件起草中文提交说明

回到 dsh，在同一仓库的会话里发送：

> 请调用 `git_commit_message`，根据当前已暂存的改动生成一条中文约定式提交说明。把建议显示给我，我会在终端确认提交。

一次可能的输出如下。实际措辞由模型生成。

```text
docs: 补充本地测试说明
```

工具读取的是 `git diff --cached`。其他未暂存的文件改动会留在工作区。

### 3. ✅ 核对后，由你执行提交

再次运行 `git diff --cached`，确认暂存内容和说明都符合预期。需要的话，先改写建议的措辞。确认后在终端自己执行：

```bash
git commit -m "docs: 补充本地测试说明"
git log -1 --oneline
```

如果模型给出了多行正文，可以运行 `git commit`，在编辑器里填写主题和正文。插件工具的操作到返回说明为止，提交由你执行上面的 Git 命令。

## 🔍 遇到问题时

- **提示暂存区为空。** 在仓库里运行 `git status --short`，用 `git add -- <文件路径>` 暂存所需改动，再请求生成。
- **提示当前目录不是 Git 仓库。** 把 dsh 会话的工作区切到仓库，再运行 `git diff --cached` 对照检查。
- **说明遗漏部分改动。** 查看完整暂存差异，必要时手动补全说明。生成时差异默认最多发送 12,000 字符，较大的差异会被截断。生成说明会使用当前模型路由并产生 token 用量。

<details>
<summary>⌨️ 终端安装、配置与开发</summary>

把以下命令中的 `web` 换成你实际使用的 profile 名称，安装后启动对应 profile。

```bash
dsh plugin --profile web add "github:ChenYueqi2024/dsh-commit#v0.2.2"
```

Git 安装通过 `prepare` 构建入口。如果 pnpm 拦截构建，将错误提示中的**精确包名与 Git 哈希键**加入该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds`，保留原有配置并重试。

| 配置项 | 默认值 |
|---|---|
| `provider` / `model` | `deepseek-official` / `deepseek-flash` |
| `maxDiffChars` | `12000` |
| `timeoutMs` | `120000` 毫秒 |

从源码开发时运行 `npm ci` 和 `npm test`。当前有 7 个单元测试，CI 也会验证 Git 安装后的入口文件和 bundle patch。

</details>

## License

[MIT](LICENSE)
