import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ArchiveShopsService } from 'src/common/tasks/archive-shops.service';

interface ArchiveShopsCommandOptions {
  ids?: string[];
  all?: boolean;
  exclude?: string[];
  confirm?: boolean;
}

@Command({
  name: 'archive-shops',
  description:
    '把指定的 shop 歸檔成 ArchivedShop 並刪除原始資料。預設是 dry-run，要加 --confirm 才會真的執行。',
})
export class ArchiveShopsCommand extends CommandRunner {
  private readonly logger = new Logger(ArchiveShopsCommand.name);

  constructor(private readonly archiveShopsService: ArchiveShopsService) {
    super();
  }

  async run(
    _inputs: string[],
    options: ArchiveShopsCommandOptions,
  ): Promise<void> {
    const { ids, all, exclude, confirm } = options;

    if (!all && (!ids || ids.length === 0)) {
      this.logger.error(
        '請用 --ids=id1,id2,id3 指定要歸檔的 shop，或用 --all 全部歸檔',
      );
      process.exitCode = 1;
      return;
    }

    if (all && ids && ids.length > 0) {
      this.logger.error('--all 跟 --ids 不能同時使用，請只選一個');
      process.exitCode = 1;
      return;
    }

    const targetIds = all
      ? await this.archiveShopsService.listShopIds(exclude ?? [])
      : (ids as string[]);

    if (targetIds.length === 0) {
      this.logger.warn('沒有符合條件的 shop，結束');
      return;
    }

    if (!confirm) {
      this.logger.log(
        `[DRY RUN] 準備預覽 ${targetIds.length} 家 shop（${all ? '--all' : '--ids'}），不會寫入或刪除任何資料`,
      );
      for (const shopId of targetIds) {
        try {
          const preview = await this.archiveShopsService.previewArchive(shopId);
          this.logger.log(JSON.stringify(preview, null, 2));
        } catch (error) {
          this.logger.error(`預覽失敗 (shopId=${shopId})`, error as Error);
        }
      }
      this.logger.log(
        '這是 dry-run 結果。確認沒問題後，加上 --confirm 才會真的執行歸檔+刪除。',
      );
      return;
    }

    // --all + --confirm 是最危險的組合（一次刪掉全部），額外加一道打字確認
    if (all) {
      const rl = readline.createInterface({ input, output });
      const answer = await rl.question(
        `即將永久歸檔並刪除全部 ${targetIds.length} 家 shop，此動作無法復原。\n` +
          `請輸入要刪除的家數「${targetIds.length}」以確認繼續： `,
      );
      rl.close();

      if (answer.trim() !== String(targetIds.length)) {
        this.logger.warn('輸入不符，已取消，沒有任何資料被異動');
        return;
      }
    }

    this.logger.warn(
      `即將正式歸檔並刪除 ${targetIds.length} 家 shop，這是破壞性操作`,
    );
    const summary = await this.archiveShopsService.archiveShops(targetIds);

    this.logger.log(
      `完成：total=${summary.total}, succeeded=${summary.succeeded.length}, failed=${summary.failed.length}`,
    );
    if (summary.failed.length > 0) {
      this.logger.error(`失敗清單: ${JSON.stringify(summary.failed, null, 2)}`);
      process.exitCode = 1;
    }
  }

  @Option({
    flags: '--ids <ids>',
    description:
      '要歸檔的 shop id，逗號分隔，例如 --ids=id1,id2,id3。跟 --all 互斥。',
  })
  parseIds(val: string): string[] {
    return this.parseCommaList(val);
  }

  @Option({
    flags: '--all',
    description:
      '歸檔目前資料庫裡的全部 shop。跟 --ids 互斥，務必先 dry-run 過再加 --confirm。',
  })
  parseAll(): boolean {
    return true;
  }

  @Option({
    flags: '--exclude <ids>',
    description:
      '搭配 --all 使用，排除不想被這次批次動到的 shop id，逗號分隔。',
  })
  parseExclude(val: string): string[] {
    return this.parseCommaList(val);
  }

  @Option({
    flags: '--confirm',
    description: '真的執行歸檔+刪除。不加這個 flag 只會 dry-run 預覽。',
  })
  parseConfirm(): boolean {
    return true;
  }

  private parseCommaList(val: string): string[] {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
