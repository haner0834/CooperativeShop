import { env } from './env.utils';

export function getImageUrl(fileKey: string) {
  return `${env('R2_PUBLIC_URL')}/${fileKey}`;
}
