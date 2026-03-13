#!/usr/bin/env node
/**
 * 钉钉 MCP Server
 * 让 Claude Code / Cursor 直接操作钉钉消息、机器人、审批
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DingTalkClient } from "./dingtalk-client.js";
import { tools } from "./tools.js";

// 支持两种模式：
// 1. 机器人 Webhook（无需审批，直接发群消息）
// 2. 企业内部应用（需要 AppKey + AppSecret，功能更全）
const WEBHOOK_URL = process.env.DINGTALK_WEBHOOK_URL;
const APP_KEY = process.env.DINGTALK_APP_KEY;
const APP_SECRET = process.env.DINGTALK_APP_SECRET;

if (!WEBHOOK_URL && (!APP_KEY || !APP_SECRET)) {
  console.error("错误: 请至少设置以下环境变量之一：");
  console.error("  机器人模式: DINGTALK_WEBHOOK_URL");
  console.error("  应用模式:  DINGTALK_APP_KEY + DINGTALK_APP_SECRET");
  console.error("");
  console.error("获取方式: 访问 https://open.dingtalk.com 创建企业内部应用或群机器人");
  process.exit(1);
}

const client = new DingTalkClient({
  webhookUrl: WEBHOOK_URL,
  appKey: APP_KEY,
  appSecret: APP_SECRET,
});

const server = new Server(
  { name: "dingtalk-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ─── 机器人消息（Webhook 模式，无需鉴权）─────────────
      case "dingtalk_send_webhook": {
        const result = await client.sendWebhook(
          args!.content as string,
          (args!.msg_type as string) || "text",
          args!.at_mobiles as string[] | undefined,
          (args!.at_all as boolean) || false
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ─── 工作通知（应用模式）────────────────────────────
      case "dingtalk_send_work_notice": {
        const result = await client.sendWorkNotice(
          args!.user_id_list as string[],
          args!.msg as Record<string, unknown>
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ─── 用户信息 ────────────────────────────────────────
      case "dingtalk_get_user_by_mobile": {
        const result = await client.getUserByMobile(args!.mobile as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ─── 审批 ────────────────────────────────────────────
      case "dingtalk_create_approval": {
        const result = await client.createApproval({
          processCode: args!.process_code as string,
          originatorUserId: args!.originator_user_id as string,
          approvers: args!.approvers as string[],
          formValues: args!.form_values as Array<{ name: string; value: string }>,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "dingtalk_get_approval": {
        const result = await client.getApproval(args!.process_instance_id as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // ─── 日程 ────────────────────────────────────────────
      case "dingtalk_create_schedule": {
        const result = await client.createSchedule({
          summary: args!.summary as string,
          startTime: args!.start_time as string,
          endTime: args!.end_time as string,
          attendees: args!.attendees as string[] | undefined,
          description: args!.description as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
      content: [{ type: "text", text: `调用钉钉 API 失败: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = WEBHOOK_URL ? "机器人 Webhook 模式" : "企业应用模式";
  console.error(`钉钉 MCP Server 已启动 ✅ (${mode})`);
}

main().catch(console.error);
