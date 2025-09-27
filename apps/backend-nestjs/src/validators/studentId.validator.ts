import { z } from "zod";

// 定義學號格式的 Schema，方便解析和驗證
const StudentIdFormatSchema = z
  .object({
    length: z.number().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    regex: z.string().optional(),
  })
  .nullable();

type StudentIdFormat = z.infer<typeof StudentIdFormatSchema>;

export const validateStudentId = (
  studentId: string,
  format: unknown
): boolean => {
  const parsedFormat: StudentIdFormat = StudentIdFormatSchema.parse(format);

  if (!parsedFormat) {
    // 如果學校沒有定義格式，我們預設為通過
    return true;
  }

  if (parsedFormat.length && studentId.length !== parsedFormat.length) {
    return false;
  }
  if (parsedFormat.prefix && !studentId.startsWith(parsedFormat.prefix)) {
    return false;
  }
  if (parsedFormat.suffix && !studentId.endsWith(parsedFormat.suffix)) {
    return false;
  }
  if (parsedFormat.regex) {
    const regex = new RegExp(parsedFormat.regex);
    if (!regex.test(studentId)) {
      return false;
    }
  }

  return true;
};
