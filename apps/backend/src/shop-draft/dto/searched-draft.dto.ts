import { Expose } from 'class-transformer';

export class SearchedDraftDto {
  @Expose() similarity: number;
  @Expose() id: string;
  @Expose() title: string;
  @Expose() subtitle: string | null;
  @Expose() normalizedKey: string;
  @Expose() thumbnailKey: string | null;
  @Expose() school: {
    name: string;
    id: string;
    abbreviation: string;
  };
}
