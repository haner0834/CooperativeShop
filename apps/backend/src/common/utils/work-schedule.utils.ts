import { Weekday } from 'src/shop-draft/dto/shop-draft.dto';
import {
  WorkScheduleDto,
  WorkScheduleType,
} from 'src/shops/dto/create-shop.dto';
import { formatWeekdays, weekdayOrder } from './weekday.utils';

export interface ScheduleRange {
  start: number;
  end: number;
  type: WorkScheduleType;
  scheduleNote?: string;
}

export interface GroupedSchedule {
  days: Weekday[];
  ranges: ScheduleRange[];
}

/**
 * 將原始營業時間陣列依據「相同時間與備註」合併相鄰/相同的星期
 */
export const groupWorkSchedules = (
  workSchedules: WorkScheduleDto[],
): GroupedSchedule[] => {
  if (!workSchedules || workSchedules.length === 0) return [];

  // 1. 按 Weekday 分組
  const dayMap = new Map<Weekday, ScheduleRange[]>();
  workSchedules.forEach((sch) => {
    if (!dayMap.has(sch.weekday)) {
      dayMap.set(sch.weekday, []);
    }
    dayMap.get(sch.weekday)!.push({
      start: sch.startMinuteOfDay,
      end: sch.endMinuteOfDay,
      type: sch.type,
      scheduleNote: sch.scheduleNote ?? undefined,
    });
  });

  // 2. 依開始時間排序各星期的時段
  dayMap.forEach((ranges) => {
    ranges.sort((a, b) => a.start - b.start);
  });

  // 3. 根據相同的 Signature 進行星期的合併
  const groupedSchedules = new Map<string, GroupedSchedule>();
  dayMap.forEach((ranges, day) => {
    const signature = ranges
      .map((r) => `${r.start}-${r.end}|${r.type}|${r.scheduleNote ?? ''}`)
      .join(',');

    if (!groupedSchedules.has(signature)) {
      groupedSchedules.set(signature, { days: [], ranges });
    }
    groupedSchedules.get(signature)!.days.push(day);
  });

  // 4. 依照星期順序排序輸出結果
  return Array.from(groupedSchedules.values()).sort((a, b) => {
    const idxA = weekdayOrder.indexOf(a.days[0]);
    const idxB = weekdayOrder.indexOf(b.days[0]);
    return idxA - idxB;
  });
};

/**
 * 將分鐘數轉為 HH:mm 格式 (例如 540 -> "09:00")
 */
const formatMinutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * 根據 WorkScheduleBackend 生成純文字版營業時間說明
 */
export const generateScheduleText = (
  workSchedules: WorkScheduleDto[],
): string => {
  const groups = groupWorkSchedules(workSchedules);

  if (groups.length === 0) {
    return '暫無營業時間資訊';
  }

  return groups
    .map((group) => {
      // 1. 格式化星期字串
      const daysText = formatWeekdays(group.days);

      // 2. 格式化時段字串
      const timeRangesText = group.ranges
        .map((range) => {
          const startTime = formatMinutesToTime(range.start);
          const endTime = formatMinutesToTime(range.end);

          let text = `${startTime} - ${endTime}`;

          // 若為彈性時間或有備註，加上標記
          const noteParts: string[] = [];
          if (range.type === 'FLEXIBLE') noteParts.push('彈性');
          if (range.scheduleNote) noteParts.push(range.scheduleNote);

          if (noteParts.length > 0) {
            text += ` (${noteParts.join('，')})`;
          }

          return text;
        })
        .join(' / '); // 多個時段用斜線分隔，如 "09:00 - 12:00 / 14:00 - 18:00"

      return `${daysText}：${timeRangesText}`;
    })
    .join('\n');
};
