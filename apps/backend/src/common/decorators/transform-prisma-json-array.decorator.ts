import {
  Transform,
  plainToInstance,
  ClassConstructor,
} from 'class-transformer';

/**
 * 自訂裝飾器：專門處理 Prisma Json 欄位的陣列轉換
 * @param cls 目標 Dto 的 Class 類別
 */
export function TransformPrismaJsonArray<T>(cls: ClassConstructor<T>) {
  return Transform(({ value }) => {
    // 確保 value 存在且是陣列（防呆）
    if (!value || !Array.isArray(value)) return [];

    // 強制將 Json 陣列，逐個轉成目標 Dto 實例
    return plainToInstance(cls, value);
  });
}
