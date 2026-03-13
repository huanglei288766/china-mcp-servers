/**
 * 企业微信 MCP 工具定义
 */

/** Webhook 模式下可用的工具 */
export const webhookTools = [
  {
    name: "wecom_send_webhook",
    description:
      "通过企业微信群机器人 Webhook 发送消息（最简单，无需企业应用权限）。支持文本和 Markdown 格式。",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "消息内容。文本消息直接填写，Markdown 消息填写 markdown 格式内容",
        },
        msg_type: {
          type: "string",
          enum: ["text", "markdown"],
          description: "消息类型，默认 text",
          default: "text",
        },
      },
      required: ["content"],
    },
  },
];

/** 企业应用模式下可用的工具（包含全部功能） */
export const appTools = [
  // ─── 应用消息 ──────────────────────────────────────────────
  {
    name: "wecom_send_message",
    description:
      "通过企业微信应用发送消息给指定用户/部门/标签（需要企业应用权限）。支持 text、markdown、textcard 格式。",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "消息内容。text 和 markdown 类型填写内容，textcard 类型填写描述",
        },
        msg_type: {
          type: "string",
          enum: ["text", "markdown", "textcard"],
          description: "消息类型，默认 text",
          default: "text",
        },
        to_user: {
          type: "string",
          description:
            "接收消息的用户 ID 列表，多个用 '|' 分隔（如 'user1|user2'），默认 @all",
        },
        to_party: {
          type: "string",
          description: "接收消息的部门 ID 列表，多个用 '|' 分隔",
        },
        to_tag: {
          type: "string",
          description: "接收消息的标签 ID 列表，多个用 '|' 分隔",
        },
        title: {
          type: "string",
          description: "卡片消息标题（仅 textcard 类型需要）",
        },
        url: {
          type: "string",
          description: "卡片消息跳转链接（仅 textcard 类型需要）",
        },
        btn_txt: {
          type: "string",
          description: "卡片消息按钮文字（仅 textcard 类型需要），默认 '详情'",
        },
      },
      required: ["content"],
    },
  },

  // ─── 群机器人 Webhook（应用模式也可用，如果配置了 key）─────
  ...webhookTools,

  // ─── 用户信息 ──────────────────────────────────────────────
  {
    name: "wecom_get_user",
    description: "获取企业微信用户详细信息（需要企业应用权限）",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "企业微信用户 ID",
        },
      },
      required: ["user_id"],
    },
  },
  {
    name: "wecom_list_department_users",
    description: "获取企业微信指定部门的成员列表（需要企业应用权限）",
    inputSchema: {
      type: "object",
      properties: {
        department_id: {
          type: "number",
          description: "部门 ID（根部门为 1）",
          default: 1,
        },
      },
      required: ["department_id"],
    },
  },

  // ─── 日程 ──────────────────────────────────────────────────
  {
    name: "wecom_create_schedule",
    description: "在企业微信创建日程（需要企业应用权限）",
    inputSchema: {
      type: "object",
      properties: {
        organizer: {
          type: "string",
          description: "组织者的用户 ID",
        },
        summary: {
          type: "string",
          description: "日程标题",
        },
        start_time: {
          type: "number",
          description: "开始时间（Unix 时间戳，单位：秒）",
        },
        end_time: {
          type: "number",
          description: "结束时间（Unix 时间戳，单位：秒）",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "参与人用户 ID 列表",
        },
        description: {
          type: "string",
          description: "日程描述",
        },
      },
      required: ["organizer", "summary", "start_time", "end_time"],
    },
  },
];
