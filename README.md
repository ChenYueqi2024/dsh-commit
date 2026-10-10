# dsh-commit

> github.com/ChenYueqi2024/dsh-commit · 旗舰插件：github.com/ChenYueqi2024/dsh-memory

[DeepSeek Harness（dsh）](https://github.com/deepseek-ai/deepseek-harness)的原生工具插件：读取 git 暂存区 diff，通过一次辅助 LLM 调用生成**中文约定式提交信息**（Conventional Commits）。

设计原则：**插件只生成，不提交**。`git commit` 由模型用自己的 shell 工具执行，完整保留 dsh 的权限审批管线——工具不做任何绕过权限的事。

## 使用

暂存改动后，对 Agent 说：

> 用 git_commit_message 生成提交信息

返回形如：

```
feat(calc): 新增 add 函数与 node_modules 忽略规则
```

## 快速开始

```bash
npm install && npm test && npm run build   # 7 个单元测试 + 构建
# 复制进 profile 的 node_modules，并在 cordis.patch.yml 插入：
# - insert:
#     - id: dsh-commit
#       name: dsh-commit
#       config: { provider: deepseek-official, model: deepseek-flash }
```

配置：`provider`/`model`（生成所用模型路由）、`maxDiffChars`（送入模型的 diff 上限，默认 12000）、`timeoutMs`。

## License

MIT
