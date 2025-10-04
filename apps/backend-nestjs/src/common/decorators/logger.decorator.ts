import { Logger } from '@nestjs/common';

interface LogOptions {
  /** 是否記錄方法參數 (預設: true) */
  logArgs?: boolean;
  /** 是否記錄返回值 (預設: true) */
  logReturn?: boolean;
  /** 是否記錄執行時間 (預設: true) */
  logDuration?: boolean;
  /** 是否記錄錯誤堆疊 (預設: true) */
  logStack?: boolean;
  /** 自定義日誌標籤前綴 */
  prefix?: string;
  /** 參數過濾器函數，用於隱藏敏感資料 */
  argsFilter?: (args: any[]) => any[];
  /** 返回值過濾器函數，用於隱藏敏感資料 */
  returnFilter?: (result: any) => any;
}

/**
 * 預設的參數過濾器，隱藏常見的敏感欄位
 */
function defaultArgsFilter(args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      if (
        arg instanceof Request ||
        arg instanceof Response ||
        (arg &&
          typeof arg === 'object' &&
          (arg.constructor?.name === 'Socket' ||
            arg.constructor?.name === 'ServerResponse' ||
            arg.constructor?.name === 'IncomingMessage'))
      ) {
        return `[Filtered ${arg.constructor?.name}]`;
      }

      const filtered = { ...arg };
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'refreshToken',
        'accessToken',
        'signature',
      ];
      sensitiveFields.forEach((field) => {
        if (field in filtered) filtered[field] = '***HIDDEN***';
      });
      return filtered;
    }
    return arg;
  });
}

/**
 * 一個方法裝飾器，自動記錄方法的調用、成功返回和異常拋出
 *
 * @param options 日誌記錄選項
 * @requires 該裝飾器所在的類別實例中必須有一個名為 `logger` 的屬性，
 * 且該屬性是一個有效的 Logger 實例 (例如 @nestjs/common 的 Logger 或 LoggerService)
 *
 * @example
 * ```typescript
 * // 基本使用
 * @Log()
 * async someMethod() { ... }
 *
 * // 帶配置選項
 * @Log({ logArgs: false, prefix: 'API' })
 * async apiMethod() { ... }
 *
 * // 自定義過濾器
 * @Log({
 *   argsFilter: (args) => args.map(arg => ({ ...arg, sensitiveData: '***' }))
 * })
 * async processData(data) { ... }
 * ```
 */
export function Log(options: LogOptions = {}): MethodDecorator {
  const {
    logArgs = true,
    logReturn = true,
    logDuration = true,
    logStack = true,
    prefix = '',
    argsFilter = defaultArgsFilter,
    returnFilter = (result) => result,
  } = options;

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const logContext = `${prefix ? `[${prefix}]` : ''}${className}.${methodName}`;

    descriptor.value = async function (...args: any[]) {
      const logger = new Logger(logContext);
      const startTime = Date.now();

      try {
        const filteredArgs = logArgs ? argsFilter(args) : undefined;
        logger.log({
          message: `[CALL] ${logContext}`,
          metadata: { args: filteredArgs, timestamp: new Date().toISOString() },
        });

        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.log({
          message: `[SUCCESS] ${logContext}`,
          metadata: {
            return: logReturn ? returnFilter(result) : undefined,
            duration: logDuration ? `${duration}ms` : undefined,
            timestamp: new Date().toISOString(),
          },
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        logger.error({
          message: `[ERROR] ${logContext}`,
          metadata: {
            error: error?.message || 'Unknown error',
            stack: logStack ? error?.stack : undefined,
            duration: logDuration ? `${duration}ms` : undefined,
            timestamp: new Date().toISOString(),
          },
        });

        throw error;
      }
    };

    return descriptor;
  };
}
