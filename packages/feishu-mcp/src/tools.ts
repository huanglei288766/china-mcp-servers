/**
 * 飞书 MCP 工具定义
 */
export const tools = [
  // ─── 消息 ─────────────────────────────────────────────
  {
    name: "feishu_send_message",
    description: "发送飞书消息给用户或群组",
    inputSchema: {
      type: "object",
      properties: {
        receive_id: {
          type: "string",
          description: "接收者 ID（用户 open_id 或群 chat_id）",
        },
        receive_id_type: {
          type: "string",
          enum: ["open_id", "user_id", "union_id", "email", "chat_id"],
          description: "接收者 ID 类型，默认 open_id",
          default: "open_id",
        },
        content: {
          type: "string",
          description: "消息内容。文本消息直接填写内容即可",
        },
        msg_type: {
          type: "string",
          enum: ["text", "post", "interactive"],
          description: "消息类型，默认 text",
          default: "text",
        },
      },
      required: ["receive_id", "content"],
    },
  },
  {
    name: "feishu_get_messages",
    description: "获取飞书会话的消息历史",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "会话 ID（chat_id）",
        },
        start_time: {
          type: "string",
          description: "开始时间（Unix 时间戳，秒）",
        },
        end_time: {
          type: "string",
          description: "结束时间（Unix 时间戳，秒）",
        },
      },
      required: ["container_id"],
    },
  },

  // ─── 文档 ─────────────────────────────────────────────
  {
    name: "feishu_create_doc",
    description: "在飞书云文档中创建新文档",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "文档标题",
        },
        content: {
          type: "string",
          description: "文档初始内容（Markdown 格式）",
        },
        folder_token: {
          type: "string",
          description: "存放的文件夹 token，不填则放在根目录",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "feishu_get_doc",
    description: "获取飞书文档内容",
    inputSchema: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "文档 ID",
        },
      },
      required: ["document_id"],
    },
  },

  // ─── 日历 ─────────────────────────────────────────────
  {
    name: "feishu_get_calendar",
    description: "获取飞书日历中的日程安排",
    inputSchema: {
      type: "object",
      properties: {
        start_time: {
          type: "string",
          description: "查询起始时间（如 '2026-03-14' 或 Unix 时间戳）",
        },
        end_time: {
          type: "string",
          description: "查询结束时间",
        },
      },
      required: ["start_time", "end_time"],
    },
  },
  {
    name: "feishu_create_event",
    description: "在飞书日历中创建会议或日程",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "日程标题",
        },
        start_time: {
          type: "string",
          description: "开始时间（ISO 8601 格式，如 '2026-03-14T14:00:00+08:00'）",
        },
        end_time: {
          type: "string",
          description: "结束时间（ISO 8601 格式）",
        },
        description: {
          type: "string",
          description: "日程描述",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "参会人的 open_id 列表",
        },
      },
      required: ["summary", "start_time", "end_time"],
    },
  },

  // ─── 任务 ─────────────────────────────────────────────
  {
    name: "feishu_create_task",
    description: "在飞书任务中创建新任务",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "任务标题",
        },
        due_time: {
          type: "string",
          description: "截止时间（Unix 时间戳，秒）",
        },
        assignee_id: {
          type: "string",
          description: "负责人 open_id",
        },
      },
      required: ["summary"],
    },
  },
  {
    name: "feishu_list_tasks",
    description: "列出飞书任务列表",
    inputSchema: {
      type: "object",
      properties: {
        page_size: {
          type: "number",
          description: "每页数量，默认 20",
          default: 20,
        },
      },
    },
  },
];
