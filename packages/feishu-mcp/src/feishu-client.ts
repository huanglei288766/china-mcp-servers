/**
 * 飞书 Open API 客户端
 * 文档: https://open.feishu.cn/document/
 */
import axios, { AxiosInstance } from "axios";

const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";

interface TokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

export class FeishuClient {
  private readonly appId: string;
  private readonly appSecret: string;
  private accessToken: string = "";
  private tokenExpireAt: number = 0;
  private readonly http: AxiosInstance;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.http = axios.create({ baseURL: FEISHU_BASE_URL, timeout: 10000 });
  }

  // 获取 tenant_access_token（自动续期）
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireAt - 60_000) {
      return this.accessToken;
    }

    const res = await this.http.post<TokenResponse>(
      "/auth/v3/tenant_access_token/internal",
      { app_id: this.appId, app_secret: this.appSecret },
    );

    if (res.data.code !== 0) {
      throw new Error(`飞书鉴权失败: ${res.data.msg}`);
    }

    this.accessToken = res.data.tenant_access_token;
    this.tokenExpireAt = Date.now() + res.data.expire * 1000;
    return this.accessToken;
  }

  private async authHeaders() {
    const token = await this.getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  // ─── 消息 API ─────────────────────────────────────────

  async sendMessage(
    receiveId: string,
    receiveIdType: string,
    content: string,
    msgType: string = "text",
  ) {
    const headers = await this.authHeaders();

    // 文本消息自动包装格式
    const messageContent =
      msgType === "text" ? JSON.stringify({ text: content }) : content;

    const res = await this.http.post(
      `/im/v1/messages?receive_id_type=${receiveIdType}`,
      { receive_id: receiveId, msg_type: msgType, content: messageContent },
      { headers },
    );
    return res.data;
  }

  async getMessages(containerId: string, startTime?: string, endTime?: string) {
    const headers = await this.authHeaders();
    const params: Record<string, string> = {
      container_id_type: "chat",
      container_id: containerId,
    };
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    const res = await this.http.get("/im/v1/messages", {
      headers,
      params,
    });
    return res.data;
  }

  // ─── 文档 API ─────────────────────────────────────────

  async createDoc(title: string, content: string = "", folderToken?: string) {
    const headers = await this.authHeaders();
    // Step 1: 创建空文档
    const createRes = await this.http.post(
      "/docx/v1/documents",
      { folder_token: folderToken, title },
      { headers },
    );
    const documentId = createRes.data?.data?.document?.document_id;

    // Step 2: 如果有内容，通过 blocks API 写入
    if (content && documentId) {
      const blockId = createRes.data?.data?.document?.document_id;
      await this.http.post(
        `/docx/v1/documents/${documentId}/blocks/${blockId}/children`,
        {
          children: [
            {
              block_type: 2, // text block
              text: { elements: [{ text_run: { content } }] },
            },
          ],
        },
        { headers },
      );
    }

    return createRes.data;
  }

  async getDoc(documentId: string) {
    const headers = await this.authHeaders();
    const res = await this.http.get(`/docx/v1/documents/${documentId}`, {
      headers,
    });
    return res.data;
  }

  // ─── 日历 API ─────────────────────────────────────────

  async getCalendarEvents(startTime: string, endTime: string) {
    const headers = await this.authHeaders();
    // 先获取主日历 ID
    const calRes = await this.http.get("/calendar/v4/calendars", {
      headers,
    });
    const calendarId = calRes.data?.data?.calendar_list?.[0]?.calendar_id;

    const res = await this.http.get(
      `/calendar/v4/calendars/${calendarId}/events`,
      {
        headers,
        params: { start_time: startTime, end_time: endTime },
      },
    );
    return res.data;
  }

  async createCalendarEvent(event: {
    summary: string;
    start_time: string;
    end_time: string;
    description?: string;
    attendees?: string[];
  }) {
    const headers = await this.authHeaders();
    const calRes = await this.http.get("/calendar/v4/calendars", {
      headers,
    });
    const calendarId = calRes.data?.data?.calendar_list?.[0]?.calendar_id;

    const body: Record<string, unknown> = {
      summary: event.summary,
      start_time: { timestamp: event.start_time },
      end_time: { timestamp: event.end_time },
    };
    if (event.description) body.description = event.description;
    if (event.attendees?.length) {
      body.attendee_ability = "none";
      body.attendees = event.attendees.map((id) => ({
        type: "user",
        user_id: id,
      }));
    }

    const res = await this.http.post(
      `/calendar/v4/calendars/${calendarId}/events`,
      body,
      { headers },
    );
    return res.data;
  }

  // ─── 任务 API ─────────────────────────────────────────

  async createTask(task: {
    summary: string;
    due_time?: string;
    assignee_id?: string;
  }) {
    const headers = await this.authHeaders();
    const body: Record<string, unknown> = { summary: task.summary };
    if (task.due_time) body.due = { timestamp: task.due_time };
    if (task.assignee_id)
      body.collaborator_ids = [{ id: task.assignee_id, type: "user" }];

    const res = await this.http.post("/task/v2/tasks", body, { headers });
    return res.data;
  }

  async listTasks(pageSize: number = 20) {
    const headers = await this.authHeaders();
    const res = await this.http.get("/task/v2/tasks", {
      headers,
      params: { page_size: pageSize },
    });
    return res.data;
  }
}
