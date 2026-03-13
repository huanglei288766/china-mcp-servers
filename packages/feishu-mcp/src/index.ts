#!/usr/bin/env node
/**
 * 飞书 MCP Server
 * 让 Claude Code / Cursor 直接操作飞书消息、文档、日历
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FeishuClient } from "./feishu-client.js";
import { tools } from "./tools.js";

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;

if (!APP_ID || !APP_SECRET) {
  console.error("错误: 请设置环境变量 FEISHU_APP_ID 和 FEISHU_APP_SECRET");
  console.error("获取方式: 访问 https://open.feishu.cn 创建企业自建应用");
  process.exit(1);
}

const client = new FeishuClient(APP_ID, APP_SECRET);

const server = new Server(
  {
    name: "feishu-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ─── 消息 ───────────────────────────────────────
      case "feishu_send_message": {
        const result = await client.sendMessage(
          args!.receive_id as string,
          args!.receive_id_type as string,
          args!.content as string,
          (args!.msg_type as string) || "text"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "feishu_get_messages": {
        const result = await client.getMessages(
          args!.container_id as string,
          args!.start_time as string,
          args!.end_time as string
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 文档 ───────────────────────────────────────
      case "feishu_create_doc": {
        const result = await client.createDoc(
          args!.title as string,
          args!.content as string,
          args!.folder_token as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "feishu_get_doc": {
        const result = await client.getDoc(args!.document_id as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 日历 ───────────────────────────────────────
      case "feishu_get_calendar": {
        const result = await client.getCalendarEvents(
          args!.start_time as string,
          args!.end_time as string
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "feishu_create_event": {
        const result = await client.createCalendarEvent({
          summary: args!.summary as string,
          start_time: args!.start_time as string,
          end_time: args!.end_time as string,
          description: args!.description as string | undefined,
          attendees: args!.attendees as string[] | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ─── 任务 ───────────────────────────────────────
      case "feishu_create_task": {
        const result = await client.createTask({
          summary: args!.summary as string,
          due_time: args!.due_time as string | undefined,
          assignee_id: args!.assignee_id as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "feishu_list_tasks": {
        const result = await client.listTasks(
          (args!.page_size as number) || 20
        );
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
      content: [{ type: "text", text: `调用飞书 API 失败: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("飞书 MCP Server 已启动 ✅");
}

main().catch(console.error);
