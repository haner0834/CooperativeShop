import errorMap from "@shared/jsons/errors/errorMessage.json";

export type ErrorCode = keyof typeof errorMap;

export function getErrorMessage(code: ErrorCode): string {
  return errorMap[code]?.message ?? "發生未知錯誤，請稍後再試";
}
