# China MCP Servers 🇨🇳

> 中国主流服务的 MCP (Model Context Protocol) 集合 — 让 Claude Code / Cursor 一句话操作飞书、钉钉、微信

[![Stars](https://img.shields.io/github/stars/huanglei288766/china-mcp-servers?style=social)](https://github.com/huanglei288766/china-mcp-servers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)

## 🎯 一句话介绍

安装后，你可以直接在 Claude Code 中说：

> "帮我在飞书发一条消息：今天下午3点开会"
> "把这个 Git commit 整理成钉钉周报并发送给团队"
> "查一下微信公众号最近7天的阅读数据"

## ✅ 已支持服务

| 服务 | 状态 | 功能 |
|------|------|------|
| 🚀 [飞书 (Feishu)](packages/feishu-mcp/) | ✅ 已发布 | 发消息、创建文档、查日历、管理任务 |
| 🔔 [钉钉 (DingTalk)](packages/dingtalk-mcp/) | 🚧 开发中 | 发消息、机器人、审批 |
| 💬 [企业微信](packages/wecom-mcp/) | 📋 规划中 | 消息、群机器人 |
| 📝 [语雀](packages/yuque-mcp/) | 📋 规划中 | 文档读写、知识库管理 |
| 📺 [B站](packages/bilibili-mcp/) | 📋 规划中 | 数据统计、视频管理 |
| 🛒 [淘宝/天猫](packages/taobao-mcp/) | 📋 规划中 | 商品查询、订单管理 |

## 🚀 快速开始

### 1. 安装飞书 MCP Server

```bash
npx @china-mcp/feishu-mcp
```

### 2. 配置 Claude Code

在 `~/.claude.json` 中添加：

```json
{
  "mcpServers": {
    "feishu": {
      "command": "npx",
      "args": ["-y", "@china-mcp/feishu-mcp"],
      "env": {
        "FEISHU_APP_ID": "your-app-id",
        "FEISHU_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```

### 3. 重启 Claude Code，开始使用！

```
你: 帮我发一条飞书消息给张三，内容是"明天的需求评审推迟到下午4点"
Claude: 已发送消息给张三 ✅
```

## 📦 飞书 MCP 功能列表

### 消息能力
- `send_message` — 发送文本/富文本/卡片消息
- `send_group_message` — 发送群消息
- `get_message_history` — 获取消息记录

### 文档能力
- `create_doc` — 创建飞书文档
- `update_doc` — 更新文档内容
- `get_doc` — 读取文档

### 日历能力
- `get_calendar` — 查看日程
- `create_event` — 创建会议

### 任务能力
- `create_task` — 创建任务
- `list_tasks` — 查看任务列表

## 🛠️ 开发指南

```bash
# 克隆项目
git clone https://github.com/huanglei288766/china-mcp-servers.git
cd china-mcp-servers

# 安装依赖
npm install

# 开发飞书 MCP
cd packages/feishu-mcp
npm run dev
```

## 🤝 贡献新服务

欢迎贡献新的中国服务 MCP！参考 [packages/feishu-mcp](packages/feishu-mcp/) 的结构实现，提交 PR 即可。

## 📊 Star 历史

[![Star History](https://api.star-history.com/svg?repos=huanglei288766/china-mcp-servers&type=Date)](https://star-history.com/#huanglei288766/china-mcp-servers)

## 📄 License

MIT © [huanglei288766](https://github.com/huanglei288766)
