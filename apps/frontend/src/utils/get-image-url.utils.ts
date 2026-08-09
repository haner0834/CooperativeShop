export const R2_PUBLIC_URL = "https://image.cooperativeshops.org";
export function getImageUrl(fileKey: string) {
  return `${R2_PUBLIC_URL}/${fileKey}`;
}
