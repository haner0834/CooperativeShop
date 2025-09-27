import { Logger, LoggerService } from '@nestjs/common';

/**
 * Logger 裝飾器的配置選項
 */
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
 * 定義具有 logger 屬性的類型
 */
interface WithLogger {
  logger: Logger | LoggerService;
}

/**
 * 預設的參數過濾器，隱藏常見的敏感欄位
 */
function defaultArgsFilter(args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      const filtered = { ...arg };
      // 隱藏常見的敏感欄位
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'refreshToken',
        'accessToken',
      ];
      sensitiveFields.forEach((field) => {
        if (field in filtered) {
          filtered[field] = '***HIDDEN***';
        }
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
    const logPrefix = prefix ? `[${prefix}]` : '';

    // 類型檢查確保原方法存在
    if (!originalMethod || typeof originalMethod !== 'function') {
      throw new Error(
        `@Log decorator can only be applied to methods. ${className}.${methodName} is not a function.`,
      );
    }

    descriptor.value = async function (this: WithLogger, ...args: any[]) {
      // 獲取 logger 實例
      const logger = this.logger;

      // 健全性檢查
      if (
        !logger ||
        (typeof logger.log !== 'function' && typeof logger.debug !== 'function')
      ) {
        const fallbackLogger = new Logger('LogDecorator');
        fallbackLogger.warn(
          `Logger not found or invalid on instance of ${className}. Logging for ${methodName} is disabled.`,
        );
        return originalMethod.apply(this, args);
      }

      // 準備日誌資料
      const timestamp = new Date().toISOString();
      const logContext = `${logPrefix}${className}.${methodName}`;

      // 過濾參數以隱藏敏感資料
      const filteredArgs = logArgs ? argsFilter(args) : [];

      // 記錄方法調用
      const callLogData: any = { timestamp };
      if (logArgs) {
        callLogData.args = filteredArgs;
      }

      logger.log?.(`[CALL] ${logContext}`, JSON.stringify(callLogData));

      const startTime = Date.now();

      try {
        // 執行原方法
        const result = await originalMethod.apply(this, args);

        // 計算執行時間
        const duration = Date.now() - startTime;

        // 準備成功日誌資料
        const successLogData: any = { timestamp };
        if (logDuration) {
          successLogData.duration = `${duration}ms`;
        }
        if (logReturn) {
          successLogData.return = returnFilter(result);
        }

        // 記錄成功執行
        logger.log?.(`[SUCCESS] ${logContext}`, JSON.stringify(successLogData));

        return result;
      } catch (error: any) {
        // 計算執行時間
        const duration = Date.now() - startTime;

        // 準備錯誤日誌資料
        const errorLogData: any = {
          timestamp,
          error: error?.message || 'Unknown error',
        };

        if (logDuration) {
          errorLogData.duration = `${duration}ms`;
        }

        if (logStack && error?.stack) {
          errorLogData.stack = error.stack;
        }

        // 記錄錯誤
        logger.error?.(`[ERROR] ${logContext}`, JSON.stringify(errorLogData));

        // 重新拋出錯誤
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 簡化版本的 Log 裝飾器，只記錄方法調用和錯誤，不記錄參數和返回值
 */
export const LogSimple = () =>
  Log({
    logArgs: false,
    logReturn: false,
    logStack: false,
  });

/**
 * 安全版本的 Log 裝飾器，會自動過濾敏感資料
 */
export const LogSecure = (customFilter?: (args: any[]) => any[]) =>
  Log({
    argsFilter: customFilter || defaultArgsFilter,
  });

/**
 * API 專用的 Log 裝飾器
 */
export const LogAPI = () =>
  Log({
    prefix: 'API',
    argsFilter: defaultArgsFilter,
  });

// 使用範例和類型定義
export interface LoggableClass extends WithLogger {
  logger: Logger | LoggerService;
}

/**
 * 使用範例：
 *
 * @Injectable()
 * export class UserService implements LoggableClass {
 *   private readonly logger = new Logger(UserService.name);
 *
 *   @Log()
 *   async findUser(id: string): Promise<User> {
 *     // 方法實作
 *   }
 *
 *   @LogSecure()
 *   async createUser(userData: CreateUserDto): Promise<User> {
 *     // 會自動隱藏 password 等敏感欄位
 *   }
 *
 *   @LogAPI()
 *   async getUsers(): Promise<User[]> {
 *     // API 專用日誌格式
 *   }
 * }
 */
