import { sortKeysRecursive } from './sort-obj.utils';
import * as crypto from 'crypto';

/**
 * 對數據進行確定性序列化 (鍵排序和浮點數標準化) 並計算 SHA-256 Hash
 * @param data 要計算哈希的物件 (通常是 DTO)
 * @returns SHA-256 哈希字符串
 */
export function calculateRequestHash(data: any): string {
  // 1. 標準化 Float 精度
  const normalizedData = this.normalizeFloatPrecision(data);

  // 2. 確定性序列化 (鍵排序)
  const sortedData = sortKeysRecursive(normalizedData);

  // 3. 序列化成字符串，注意：JSON.stringify 會自動處理 JSON 結構的深拷貝
  const canonicalString = JSON.stringify(sortedData);

  // 4. 計算 SHA-256 (修正了 crypto.createHash 的寫法)
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}
