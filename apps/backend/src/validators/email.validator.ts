import { validateStudentId } from './studentId.validator';
import { type School } from '@prisma/client';

interface ParsedFormat {
  prefix: string;
  suffix: string;
}

/**
 * Parses an email format string like "abc<id>@def.ghi"
 * @param format The format string
 * @returns ParsedFormat object or null if invalid
 */
const parseFormat = (format: string): ParsedFormat | null => {
  if (format.startsWith('@')) return { prefix: '', suffix: format };
  const regex = /^(.*?)<id>(.*?)$/;
  const match = format.match(regex);
  if (!match) return null;
  return { prefix: match[1], suffix: match[2] };
};

/**
 * Validates a user's email against a school's multiple email formats and student ID rules.
 * @param email The user's email from Google
 * @param studentId The student ID extracted from the email
 * @param school The school object with formats
 * @returns boolean
 */
export const validateEmailAndStudentId = (
  email: string,
  school: School,
): boolean => {
  if (!school.emailFormats || school.emailFormats.length === 0) {
    // 如果沒有設定格式，則預設通過
    return true;
  }

  for (const format of school.emailFormats) {
    const parsed = parseFormat(format);
    if (!parsed) continue; // 格式字串無效，跳過

    // 檢查 email 是否符合該格式的前後綴
    if (email.startsWith(parsed.prefix) && email.endsWith(parsed.suffix)) {
      if (format.startsWith('@') && parsed.prefix === '') {
        return true;
      }
      // 提取中間的學號部分
      const studentId = email.substring(
        parsed.prefix.length,
        email.length - parsed.suffix.length,
      );

      // 驗證提取出的學號是否符合學校的學號規則
      if (validateStudentId(studentId, school.studentIdFormat)) {
        return true; // 找到一個完全匹配的格式，驗證成功
      }
    }
  }

  return false; // 遍歷完所有格式都沒找到匹配的
};
