/**
 * 钉钉 MCP 工具定义
 */
export const tools = [
  // ─── 机器人 Webhook（最简单，直接用群机器人 Token）────────
  {
    name: "dingtalk_send_webhook",
    description:
      "通过钉钉群机器人 Webhook 发送消息（最简单，无需企业应用权限）。支持 @指定人 或 @所有人。",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "消息内容。文本消息直接填写，Markdown 消息填写 markdown 格式内容",
        },
        msg_type: {
          type: "string",
          enum: ["text", "markdown", "actionCard"],
          description: "消息类型，默认 text",
          default: "text",
        },
        at_mobiles: {
          type: "array",
          items: { type: "string" },
          description: "要 @ 的手机号列表（text 类型时有效）",
        },
        at_all: {
          type: "boolean",
          description: "是否 @所有人，默认 false",
          default: false,
        },
      },
      required: ["content"],
    },
  },

  // ─── 工作通知（企业应用模式）────────────────────────────
  {
    name: "dingtalk_send_work_notice",
    description: "发送钉钉工作通知给指定员工（需要企业应用权限）",
    inputSchema: {
      type: "object",
      properties: {
        user_id_list: {
          type: "array",
          items: { type: "string" },
          description: "接收通知的员工 userId 列表（最多100人）",
        },
        msg: {
          type: "object",
          description:
            '消息体，支持 text/markdown/oa 格式。示例: {"msgtype":"text","text":{"content":"你好"}}',
        },
      },
      required: ["user_id_list", "msg"],
    },
  },

  // ─── 用户信息 ────────────────────────────────────────────
  {
    name: "dingtalk_get_user_by_mobile",
    description: "根据手机号查询钉钉员工信息（userId 等），用于后续发送消息",
    inputSchema: {
      type: "object",
      properties: {
        mobile: {
          type: "string",
          description: "员工手机号",
        },
      },
      required: ["mobile"],
    },
  },

  // ─── 审批 ────────────────────────────────────────────────
  {
    name: "dingtalk_create_approval",
    description: "发起钉钉审批流程",
    inputSchema: {
      type: "object",
      properties: {
        process_code: {
          type: "string",
          description: "审批模板的 processCode，在钉钉后台获取",
        },
        originator_user_id: {
          type: "string",
          description: "发起人的 userId",
        },
        approvers: {
          type: "array",
          items: { type: "string" },
          description: "审批人 userId 列表",
        },
        form_values: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "表单字段名" },
              value: { type: "string", description: "表单字段值" },
            },
          },
          description: "审批表单字段列表",
        },
      },
      required: ["process_code", "originator_user_id", "approvers", "form_values"],
    },
  },
  {
    name: "dingtalk_get_approval",
    description: "查询钉钉审批实例的状态和详情",
    inputSchema: {
      type: "object",
      properties: {
        process_instance_id: {
          type: "string",
          description: "审批实例 ID（发起审批时返回）",
        },
      },
      required: ["process_instance_id"],
    },
  },

  // ─── 日程 ────────────────────────────────────────────────
  {
    name: "dingtalk_create_schedule",
    description: "在钉钉日历创建日程或会议",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "日程标题",
        },
        start_time: {
          type: "string",
          description: "开始时间（ISO 8601，如 '2026-03-14T14:00:00+08:00'）",
        },
        end_time: {
          type: "string",
          description: "结束时间（ISO 8601）",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "参会人 userId 列表",
        },
        description: {
          type: "string",
          description: "日程描述",
        },
      },
      required: ["summary", "start_time", "end_time"],
    },
  },
];
