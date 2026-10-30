import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { FixDraftsService } from 'src/common/tasks/fix-drafts.service';

interface FixDraftsCommandOptions {
  ids?: string[];
  toStage?: 'ARCHIVED' | 'RESERVED';
}

@Command({
  name: 'fix-drafts',
  description:
    '【Hot Fix】立即清理 Redis 中的草稿鎖，並將卡在 EDITING 狀態的草稿批次修復/歸檔。',
})
export class FixDraftsCommand extends CommandRunner {
  private readonly logger = new Logger(FixDraftsCommand.name);

  constructor(private readonly fixDraftsService: FixDraftsService) {
    super();
  }

  async run(
    _inputs: string[],
    options: FixDraftsCommandOptions,
  ): Promise<void> {
    const { ids, toStage = 'ARCHIVED' } = options;

    this.logger.warn('🚀 開始執行 Hot Fix 草稿修復作業...');

    try {
      // 1. 強制清除 Redis 內的 draft-lock
      const deletedLocks = await this.fixDraftsService.clearRedisDraftLocks();
      this.logger.log(`[Redis] 已清除 ${deletedLocks} 個草稿鎖 (draft-lock:*)`);

      // 2. 批次修復/歸檔 DB 草稿狀態
      const updatedCount = await this.fixDraftsService.fixDraftStages({
        ids,
        targetStage: toStage,
      });

      this.logger.log(
        `[Prisma] 成功將 ${updatedCount} 筆草稿的 stage 更新為 ${toStage}`,
      );
      this.logger.log('✨ Hot Fix 完成！');
    } catch (error) {
      this.logger.error('❌ 執行 Hot Fix 過程發生錯誤', error as Error);
      process.exitCode = 1;
    }
  }

  @Option({
    flags: '--ids <ids>',
    description:
      '指定要修復的 draft id，逗號分隔（例如 --ids=id1,id2）。若不傳則預設處理全部 stage 為 EDITING 的草稿。',
  })
  parseIds(val: string): string[] {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  @Option({
    flags: '--to-stage <stage>',
    description:
      '指定修復後的目標 stage，可填 ARCHIVED 或 RESERVED，預設為 ARCHIVED。',
  })
  parseToStage(val: string): 'ARCHIVED' | 'RESERVED' {
    const upper = val.toUpperCase();
    if (upper === 'RESERVED') return 'RESERVED';
    return 'ARCHIVED';
  }
}
