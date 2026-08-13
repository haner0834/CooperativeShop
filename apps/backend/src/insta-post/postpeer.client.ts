import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { env } from 'src/common/utils/env.utils';

export interface PostPeerPostPayload {
  content: string;
  mediaItems: { type: 'image' | 'video'; url: string }[];
  platforms: { platform: 'instagram'; accountId: string }[];
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
}

@Injectable()
export class PostPeerClient {
  private readonly logger = new Logger(PostPeerClient.name);
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env('POSTPEER_BASE_URL'),
      headers: {
        'x-access-key': env('POSTPEER_API_KEY'),
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  async createPost(payload: PostPeerPostPayload) {
    try {
      const { data } = await this.http.post('/posts', payload);
      return data;
    } catch (err: any) {
      this.logger.error(
        `PostPeer API error: ${err.response?.status} ${JSON.stringify(err.response?.data)}`,
      );
      throw err;
    }
  }
}
