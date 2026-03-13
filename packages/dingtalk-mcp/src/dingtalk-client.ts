/**
 * 钉钉 Open API 客户端
 * 文档: https://open.dingtalk.com/document/
 *
 * 支持两种模式：
 * 1. Webhook 机器人（最简单）
 * 2. 企业内部应用（功能完整）
 */
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";

const DINGTALK_BASE_URL = "https://oapi.dingtalk.com";
const DINGTALK_NEW_BASE_URL = "https://api.dingtalk.com";

interface DingTalkConfig {
  webhookUrl?: string;
  appKey?: string;
  appSecret?: string;
}

interface TokenResponse {
  errcode: number;
  errmsg: string;
  access_token: string;
  expires_in: number;
}

export class DingTalkClient {
  private readonly config: DingTalkConfig;
  private accessToken: string = "";
  private tokenExpireAt: number = 0;
  private readonly http: AxiosInstance;
  private readonly newHttp: AxiosInstance;

  constructor(config: DingTalkConfig) {
    this.config = config;
    this.http = axios.create({ baseURL: DINGTALK_BASE_URL, timeout: 10000 });
    this.newHttp = axios.create({
      baseURL: DINGTALK_NEW_BASE_URL,
      timeout: 10000,
    });
  }

  // 获取企业 access_token（自动续期）
  private async getAccessToken(): Promise<string> {
    if (!this.config.appKey || !this.config.appSecret) {
      throw new Error("企业应用模式需要设置 DINGTALK_APP_KEY 和 DINGTALK_APP_SECRET");
    }
    if (this.accessToken && Date.now() < this.tokenExpireAt - 60_000) {
      return this.accessToken;
    }
    const res = await this.http.get<TokenResponse>("/gettoken", {
      params: { appkey: this.config.appKey, appsecret: this.config.appSecret },
    });
    if (res.data.errcode !== 0) {
      throw new Error(`钉钉鉴权失败: ${res.data.errmsg}`);
    }
    this.accessToken = res.data.access_token;
    this.tokenExpireAt = Date.now() + res.data.expires_in * 1000;
    return this.accessToken;
  }

  // ─── 机器人 Webhook ─────────────────────────────────────

  async sendWebhook(
    content: string,
    msgType: string = "text",
    atMobiles?: string[],
    atAll: boolean = false
  ) {
    if (!this.config.webhookUrl) {
      throw new Error("Webhook 模式需要设置 DINGTALK_WEBHOOK_URL");
    }

    let body: Record<string, unknown>;

    if (msgType === "text") {
      body = {
        msgtype: "text",
        text: { content },
        at: { atMobiles: atMobiles ?? [], isAtAll: atAll },
      };
    } else if (msgType === "markdown") {
      body = {
        msgtype: "markdown",
        markdown: { title: content.split("\n")[0].replace(/^#+\s*/, ""), text: content },
        at: { atMobiles: atMobiles ?? [], isAtAll: atAll },
      };
    } else {
      body = { msgtype: msgType, [msgType]: { content } };
    }

    // 如果 Webhook URL 包含 timestamp + sign 签名要求
    const url = await this.signWebhookUrl(this.config.webhookUrl);
    const res = await axios.post(url, body);
    return res.data;
  }

  // 钉钉机器人签名（安全模式）
  private async signWebhookUrl(webhookUrl: string): Promise<string> {
    const timestamp = Date.now();
    const secret = process.env.DINGTALK_WEBHOOK_SECRET;
    if (!secret) return webhookUrl;

    const stringToSign = `${timestamp}\n${secret}`;
    const sign = crypto
      .createHmac("sha256", secret)
      .update(stringToSign)
      .digest("base64");
    const encodedSign = encodeURIComponent(sign);
    return `${webhookUrl}&timestamp=${timestamp}&sign=${encodedSign}`;
  }

  // ─── 工作通知 ───────────────────────────────────────────

  async sendWorkNotice(
    userIdList: string[],
    msg: Record<string, unknown>
  ) {
    const token = await this.getAccessToken();
    const res = await this.http.post(
      "/topapi/message/corpconversation/asyncsend_v2",
      {
        agent_id: process.env.DINGTALK_AGENT_ID,
        userid_list: userIdList.join(","),
        msg,
      },
      { params: { access_token: token } }
    );
    return res.data;
  }

  // ─── 用户信息 ───────────────────────────────────────────

  async getUserByMobile(mobile: string) {
    const token = await this.getAccessToken();
    const res = await this.http.post(
      "/topapi/v2/user/getbymobile",
      { mobile },
      { params: { access_token: token } }
    );
    return res.data;
  }

  // ─── 审批 ────────────────────────────────────────────────

  async createApproval(params: {
    processCode: string;
    originatorUserId: string;
    approvers: string[];
    formValues: Array<{ name: string; value: string }>;
  }) {
    const token = await this.getAccessToken();
    const res = await this.http.post(
      "/topapi/processinstance/create",
      {
        process_code: params.processCode,
        originator_user_id: params.originatorUserId,
        approvers: [
          {
            action_type: "NONE",
            user_ids: params.approvers,
          },
        ],
        form_component_values: params.formValues,
      },
      { params: { access_token: token } }
    );
    return res.data;
  }

  async getApproval(processInstanceId: string) {
    const token = await this.getAccessToken();
    const res = await this.http.post(
      "/topapi/processinstance/get",
      { process_instance_id: processInstanceId },
      { params: { access_token: token } }
    );
    return res.data;
  }

  // ─── 日程（新版 API）────────────────────────────────────

  async createSchedule(params: {
    summary: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
    description?: string;
  }) {
    const token = await this.getAccessToken();
    const body: Record<string, unknown> = {
      summary: params.summary,
      start: { dateTime: params.startTime, timeZone: "Asia/Shanghai" },
      end: { dateTime: params.endTime, timeZone: "Asia/Shanghai" },
    };
    if (params.description) body.description = params.description;
    if (params.attendees?.length) {
      body.attendees = params.attendees.map((id) => ({ id }));
    }

    const res = await this.newHttp.post(
      "/v1.0/calendar/users/me/calendars/primary/events",
      body,
      { headers: { "x-acs-dingtalk-access-token": token } }
    );
    return res.data;
  }
}
