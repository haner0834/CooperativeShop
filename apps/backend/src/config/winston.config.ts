import { WinstonModuleOptions } from 'nest-winston';
import { env } from 'src/common/utils/env.utils';
import * as winston from 'winston';

interface LoggerConfig {
  environment: 'development' | 'production' | 'test';
  logLevel: string;
  betterstackHost?: string;
  betterstackToken?: string;
}

export function createWinstonConfig(
  config: LoggerConfig,
): WinstonModuleOptions {
  const { environment, logLevel, betterstackHost, betterstackToken } = config;

  const transports: winston.transport[] = [];

  // Console Transport
  if (environment === 'development') {
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          winston.format.colorize({ all: true }),
          winston.format.printf(
            ({ timestamp, level, message, context, metadata }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr =
                metadata && Object.keys(metadata).length
                  ? `\n${JSON.stringify(metadata, null, 2)}`
                  : '';
              return `[${timestamp}] ${level} ${contextStr} ${message}${metaStr}`;
            },
          ),
        ),
      }),
    );
  } else {
    // JSON 格式 for production
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  // ✅ Better Stack Transport (production only)
  if (environment === 'production' && betterstackHost && betterstackToken) {
    transports.push(
      new winston.transports.Http({
        host: betterstackHost,
        path: '/',
        ssl: true,
        level: logLevel,
        headers: {
          Authorization: `Bearer ${betterstackToken}`,
        },
      }),
    );
  }

  return {
    level: logLevel,
    transports,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ key: 'metadata' }),
    ),
    exceptionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  };
}

export const winstonLoggerOption: WinstonModuleOptions = createWinstonConfig({
  environment: env('NODE_ENV', 'development') as any,
  logLevel: env('LOG_LEVEL', 'info'),
  betterstackHost: env('BETTERSTACK_HOST'),
  betterstackToken: env('BETTERSTACK_TOKEN'),
});
