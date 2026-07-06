// instagram-post/postpeer.client.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get('POSTPEER_BASE_URL'),
      headers: {
        'x-access-key': this.config.get('POSTPEER_API_KEY'),
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
