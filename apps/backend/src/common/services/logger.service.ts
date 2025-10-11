import { WinstonModule } from 'nest-winston';
import { winstonLoggerOption } from 'src/config/winston.config';

export const AppLogger = WinstonModule.createLogger(winstonLoggerOption);
