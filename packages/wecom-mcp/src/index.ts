#!/usr/bin/env node
/**
 * 企业微信 MCP Server
 * 让 Claude Code / Cursor 直接操作企业微信消息、群机器人、日程
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WecomClient } from "./wecom-client.js";
import { webhookTools, appTools } from "./tools.js";

// 支持两种模式：
// 1. Webhook 群机器人（只需 key，最简单）
// 2. 企业应用模式（需要 corpid + corpsecret + agentid，功能更全）
const WEBHOOK_KEY = process.env.WECOM_WEBHOOK_KEY;
const CORP_ID = process.env.WECOM_CORP_ID;
const CORP_SECRET = process.env.WECOM_CORP_SECRET;
const AGENT_ID = process.env.WECOM_AGENT_ID;

if (!WEBHOOK_KEY && (!CORP_ID || !CORP_SECRET)) {
  console.error("错误: 请至少设置以下环境变量之一：");
  console.error("  Webhook 模式: WECOM_WEBHOOK_KEY");
  console.error(
    "  应用模式:     WECOM_CORP_ID + WECOM_CORP_SECRET + WECOM_AGENT_ID",
  );
  console.error("");
  console.error(
    "获取方式: 访问 https://work.weixin.qq.com 企业微信管理控制台创建应用或群机器人",
  );
  process.exit(1);
}

// 判断运行模式
const isAppMode = !!(CORP_ID && CORP_SECRET);

const client = new WecomClient({
  webhookKey: WEBHOOK_KEY,
  corpId: CORP_ID,
  corpSecret: CORP_SECRET,
  agentId: AGENT_ID,
});

// 根据模式选择可用工具
const enabledTools = isAppMode ? appTools : webhookTools;

const server = new Server(
  { name: "wecom-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: enabledTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ─── 群机器人 Webhook ────────────────────────────────
      case "wecom_send_webhook": {
        const result = await client.sendWebhook(
          args!.content as string,
          (args!.msg_type as string) || "text",
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 应用消息 ────────────────────────────────────────
      case "wecom_send_message": {
        const result = await client.sendMessage({
          toUser: args!.to_user as string | undefined,
          toParty: args!.to_party as string | undefined,
          toTag: args!.to_tag as string | undefined,
          msgType: (args!.msg_type as string) || "text",
          content: args!.content as string,
          title: args!.title as string | undefined,
          url: args!.url as string | undefined,
          btnTxt: args!.btn_txt as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 用户信息 ────────────────────────────────────────
      case "wecom_get_user": {
        const result = await client.getUser(args!.user_id as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "wecom_list_department_users": {
        const result = await client.listDepartmentUsers(
          args!.department_id as number,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 日程 ────────────────────────────────────────────
      case "wecom_create_schedule": {
        const result = await client.createSchedule({
          organizer: args!.organizer as string,
          summary: args!.summary as string,
          startTime: args!.start_time as number,
          endTime: args!.end_time as number,
          attendees: args!.attendees as string[] | undefined,
          description: args!.description as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `未知工具: ${name}` }],
          isError: true,
        };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `调用企业微信 API 失败: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = isAppMode ? "企业应用模式" : "Webhook 群机器人模式";
  console.error(`企业微信 MCP Server 已启动 (${mode})`);
}

main().catch(console.error);
