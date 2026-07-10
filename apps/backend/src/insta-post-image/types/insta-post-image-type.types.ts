export type InstaPostImageType = 'COVER' | 'INFO' | 'DESCRIPTION';

export interface InstaPostImageResult {
  type: InstaPostImageType;
  buffer: Buffer;
}
