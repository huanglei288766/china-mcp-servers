/**
 * 企业微信 Open API 客户端
 * 文档: https://developer.work.weixin.qq.com/document/
 *
 * 支持两种模式：
 * 1. Webhook 群机器人（最简单，只需 key）
 * 2. 企业应用模式（需要 corpid + corpsecret + agentid，功能完整）
 */
import axios, { AxiosInstance } from "axios";

const WECOM_BASE_URL = "https://qyapi.weixin.qq.com/cgi-bin";

interface WecomConfig {
  /** 群机器人 Webhook key */
  webhookKey?: string;
  /** 企业 ID */
  corpId?: string;
  /** 应用密钥 */
  corpSecret?: string;
  /** 应用 AgentId */
  agentId?: string;
}

interface TokenResponse {
  errcode: number;
  errmsg: string;
  access_token: string;
  expires_in: number;
}

/** 企业微信 API 通用响应 */
interface WecomResponse {
  errcode: number;
  errmsg: string;
  [key: string]: unknown;
}

export class WecomClient {
  private readonly config: WecomConfig;
  private accessToken: string = "";
  private tokenExpireAt: number = 0;
  private readonly http: AxiosInstance;

  constructor(config: WecomConfig) {
    this.config = config;
    this.http = axios.create({ baseURL: WECOM_BASE_URL, timeout: 10000 });
  }

  // ─── access_token 管理（自动缓存 + 提前 60 秒续期）─────────

  private async getAccessToken(): Promise<string> {
    if (!this.config.corpId || !this.config.corpSecret) {
      throw new Error(
        "企业应用模式需要设置 WECOM_CORP_ID 和 WECOM_CORP_SECRET",
      );
    }
    // 有效期内直接返回缓存（提前 60 秒刷新）
    if (this.accessToken && Date.now() < this.tokenExpireAt - 60_000) {
      return this.accessToken;
    }
    const res = await this.http.get<TokenResponse>("/gettoken", {
      params: { corpid: this.config.corpId, corpsecret: this.config.corpSecret },
    });
    if (res.data.errcode !== 0) {
      throw new Error(`企业微信鉴权失败: ${res.data.errmsg}`);
    }
    this.accessToken = res.data.access_token;
    // expires_in 通常为 7200 秒
    this.tokenExpireAt = Date.now() + res.data.expires_in * 1000;
    return this.accessToken;
  }

  /** 校验企业微信 API 返回结果，非 0 则抛出异常 */
  private assertSuccess(data: WecomResponse): void {
    if (data.errcode !== 0) {
      throw new Error(`企业微信 API 错误 (${data.errcode}): ${data.errmsg}`);
    }
  }

  // ─── 群机器人 Webhook ──────────────────────────────────────

  /**
   * 通过群机器人 Webhook 发送消息
   * @param content 消息内容
   * @param msgType 消息类型: text / markdown
   */
  async sendWebhook(content: string, msgType: string = "text") {
    if (!this.config.webhookKey) {
      throw new Error("Webhook 模式需要设置 WECOM_WEBHOOK_KEY");
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${this.config.webhookKey}`;

    let body: Record<string, unknown>;

    if (msgType === "markdown") {
      body = {
        msgtype: "markdown",
        markdown: { content },
      };
    } else {
      // 默认文本消息
      body = {
        msgtype: "text",
        text: { content },
      };
    }

    const res = await axios.post<WecomResponse>(url, body);
    this.assertSuccess(res.data);
    return res.data;
  }

  // ─── 应用消息 ──────────────────────────────────────────────

  /**
   * 发送应用消息（支持 text / markdown / textcard）
   * @param params 消息参数
   */
  async sendMessage(params: {
    toUser?: string;
    toParty?: string;
    toTag?: string;
    msgType: string;
    content: string;
    title?: string;
    url?: string;
    btnTxt?: string;
  }) {
    const token = await this.getAccessToken();

    if (!this.config.agentId) {
      throw new Error("发送应用消息需要设置 WECOM_AGENT_ID");
    }

    const body: Record<string, unknown> = {
      agentid: Number(this.config.agentId),
      msgtype: params.msgType,
    };

    // 至少需要一个接收方
    if (params.toUser) body.touser = params.toUser;
    if (params.toParty) body.toparty = params.toParty;
    if (params.toTag) body.totag = params.toTag;
    if (!body.touser && !body.toparty && !body.totag) {
      // 默认发给所有人
      body.touser = "@all";
    }

    // 按消息类型构造 body
    switch (params.msgType) {
      case "text":
        body.text = { content: params.content };
        break;
      case "markdown":
        body.markdown = { content: params.content };
        break;
      case "textcard":
        body.textcard = {
          title: params.title || params.content.split("\n")[0],
          description: params.content,
          url: params.url || "",
          btntxt: params.btnTxt || "详情",
        };
        break;
      default:
        throw new Error(`不支持的消息类型: ${params.msgType}`);
    }

    const res = await this.http.post<WecomResponse>("/message/send", body, {
      params: { access_token: token },
    });
    this.assertSuccess(res.data);
    return res.data;
  }

  // ─── 用户信息 ──────────────────────────────────────────────

  /**
   * 获取用户详情
   * @param userId 企业微信用户 ID
   */
  async getUser(userId: string) {
    const token = await this.getAccessToken();
    const res = await this.http.get<WecomResponse>("/user/get", {
      params: { access_token: token, userid: userId },
    });
    this.assertSuccess(res.data);
    return res.data;
  }

  /**
   * 获取部门成员列表（简单信息）
   * @param departmentId 部门 ID
   */
  async listDepartmentUsers(departmentId: number) {
    const token = await this.getAccessToken();
    const res = await this.http.get<WecomResponse>("/user/simplelist", {
      params: { access_token: token, department_id: departmentId },
    });
    this.assertSuccess(res.data);
    return res.data;
  }

  // ─── 日程 ──────────────────────────────────────────────────

  /**
   * 创建日程
   * @param params 日程参数
   */
  async createSchedule(params: {
    organizer: string;
    summary: string;
    startTime: number;
    endTime: number;
    attendees?: string[];
    description?: string;
  }) {
    const token = await this.getAccessToken();

    const schedule: Record<string, unknown> = {
      organizer: params.organizer,
      summary: params.summary,
      start_time: params.startTime,
      end_time: params.endTime,
    };
    if (params.description) {
      schedule.description = params.description;
    }
    if (params.attendees?.length) {
      schedule.attendees = params.attendees.map((userId) => ({ userid: userId }));
    }

    const res = await this.http.post<WecomResponse>(
      "/oa/schedule/add",
      { schedule },
      { params: { access_token: token } },
    );
    this.assertSuccess(res.data);
    return res.data;
  }
}
