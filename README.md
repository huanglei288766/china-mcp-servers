# China MCP Servers 🇨🇳

> 中国主流服务的 MCP (Model Context Protocol) 集合 — 让 Claude Code / Cursor 一句话操作飞书、钉钉、微信

[![Stars](https://img.shields.io/github/stars/huanglei288766/china-mcp-servers?style=social)](https://github.com/huanglei288766/china-mcp-servers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-green.svg)](https://modelcontextprotocol.io)

## 🎯 一句话介绍

安装后，你可以直接在 Claude Code 中说：

> "帮我在飞书发一条消息：今天下午3点开会"
> "给钉钉群发一条消息：服务已部署完成"
> "用企业微信通知团队：v2.0 已发布上线"
> "帮我在飞书创建一个明天下午2点的需求评审会议"

## ✅ 已支持服务

| 服务 | 状态 | 功能 |
|------|------|------|
| 🚀 [飞书 (Feishu)](packages/feishu-mcp/) | ✅ 已支持 | 发消息、创建文档、查日历、管理任务 |
| 🔔 [钉钉 (DingTalk)](packages/dingtalk-mcp/) | ✅ 已支持 | 群机器人消息、工作通知、审批、日程 |
| 💬 [企业微信 (WeCom)](packages/wecom-mcp/) | ✅ 已支持 | 应用消息、群机器人、用户查询、日程 |

## 🚀 快速开始

### 飞书 MCP

**Step 1**: 在[飞书开放平台](https://open.feishu.cn)创建企业自建应用，获取 App ID 和 App Secret

**Step 2**: 在 `~/.claude.json` 中添加：

```json
{
  "mcpServers": {
    "feishu": {
      "command": "npx",
      "args": ["-y", "@china-mcp/feishu-mcp"],
      "env": {
        "FEISHU_APP_ID": "cli_xxxxxxxx",
        "FEISHU_APP_SECRET": "xxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

**Step 3**: 重启 Claude Code，开始使用！

### 钉钉 MCP

支持两种模式：

**模式一：群机器人 Webhook（最简单，5分钟搞定）**

```json
{
  "mcpServers": {
    "dingtalk": {
      "command": "npx",
      "args": ["-y", "@china-mcp/dingtalk-mcp"],
      "env": {
        "DINGTALK_WEBHOOK_URL": "https://oapi.dingtalk.com/robot/send?access_token=xxx",
        "DINGTALK_WEBHOOK_SECRET": "SECxxxxxxxxx"
      }
    }
  }
}
```

**模式二：企业内部应用（功能完整）**

```json
{
  "mcpServers": {
    "dingtalk": {
      "command": "npx",
      "args": ["-y", "@china-mcp/dingtalk-mcp"],
      "env": {
        "DINGTALK_APP_KEY": "your-app-key",
        "DINGTALK_APP_SECRET": "your-app-secret",
        "DINGTALK_AGENT_ID": "your-agent-id"
      }
    }
  }
}
```

### 企业微信 MCP

支持两种模式：

**模式一：群机器人 Webhook（最简单，5分钟搞定）**

```json
{
  "mcpServers": {
    "wecom": {
      "command": "npx",
      "args": ["-y", "@china-mcp/wecom-mcp"],
      "env": {
        "WECOM_WEBHOOK_KEY": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

**模式二：企业应用（功能完整）**

```json
{
  "mcpServers": {
    "wecom": {
      "command": "npx",
      "args": ["-y", "@china-mcp/wecom-mcp"],
      "env": {
        "WECOM_CORP_ID": "ww_your_corp_id",
        "WECOM_CORP_SECRET": "your_corp_secret",
        "WECOM_AGENT_ID": "1000002"
      }
    }
  }
}
```

## 📦 工具列表

### 飞书 MCP

| 工具 | 功能 |
|------|------|
| `feishu_send_message` | 发送文本/富文本/卡片消息（支持个人和群聊） |
| `feishu_get_messages` | 获取会话消息历史 |
| `feishu_create_doc` | 创建飞书文档 |
| `feishu_get_doc` | 读取文档内容 |
| `feishu_get_calendar` | 查询日程安排 |
| `feishu_create_event` | 创建会议/日程 |
| `feishu_create_task` | 创建任务 |
| `feishu_list_tasks` | 查看任务列表 |

### 钉钉 MCP

| 工具 | 功能 | 所需模式 |
|------|------|----------|
| `dingtalk_send_webhook` | 群机器人消息（支持 @指定人） | Webhook |
| `dingtalk_send_work_notice` | 工作通知（发给指定员工） | 企业应用 |
| `dingtalk_get_user_by_mobile` | 根据手机号查询员工信息 | 企业应用 |
| `dingtalk_create_approval` | 发起审批流程 | 企业应用 |
| `dingtalk_get_approval` | 查询审批状态 | 企业应用 |
| `dingtalk_create_schedule` | 创建日程/会议 | 企业应用 |

### 企业微信 MCP

| 工具 | 功能 | 所需模式 |
|------|------|----------|
| `wecom_send_webhook` | 群机器人发送消息（文本/Markdown） | Webhook |
| `wecom_send_message` | 应用消息（支持 text/markdown/textcard） | 企业应用 |
| `wecom_get_user` | 获取用户详细信息 | 企业应用 |
| `wecom_list_department_users` | 获取部门成员列表 | 企业应用 |
| `wecom_create_schedule` | 创建日程 | 企业应用 |

## 🛠️ 开发指南

```bash
git clone https://github.com/huanglei288766/china-mcp-servers.git
cd china-mcp-servers
npm install

# 开发飞书 MCP
cd packages/feishu-mcp && npm run dev

# 开发钉钉 MCP
cd packages/dingtalk-mcp && npm run dev

# 开发企业微信 MCP
cd packages/wecom-mcp && npm run dev
```

## 🤝 贡献新服务

欢迎贡献新的中国服务 MCP！参考 [packages/feishu-mcp](packages/feishu-mcp/) 的结构实现，提交 PR 即可。

## 📄 License

[MIT](LICENSE) © [huanglei288766](https://github.com/huanglei288766)
