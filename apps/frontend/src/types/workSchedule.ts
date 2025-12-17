export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface WorkScheduleBackend {
  id: string;
  weekday: Weekday;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
}

// Seperate them because this interface match more to the
// interaction in shop register form.
export interface WorkSchedule {
  weekdays: Weekday[];
  range: [number, number]; // 0 ~ 1440 (mins)
}

/**
 * Transforms WorkSchedule array to WorkScheduleBackend array
 * Converts hour-based ranges to minute-based ranges and expands weekdays
 */
export function toBackendSchedules(
  schedules: WorkSchedule[]
): WorkScheduleBackend[] {
  const result: WorkScheduleBackend[] = [];
  schedules.forEach((schedule) => {
    const [startMinuteOfDay, endMinuteOfDay] = schedule.range;
    schedule.weekdays.forEach((weekday) => {
      result.push({
        id: crypto.randomUUID(),
        weekday,
        startMinuteOfDay,
        endMinuteOfDay,
      });
    });
  });
  return result;
}

/**
 * Transforms WorkScheduleBackend array to WorkSchedule array
 * Groups schedules by identical time ranges and combines weekdays
 */
export function fromBackendSchedules(
  backendSchedules: WorkScheduleBackend[]
): WorkSchedule[] {
  // Group by time range
  const grouped = new Map<string, WorkScheduleBackend[]>();

  backendSchedules.forEach((schedule) => {
    const key = `${schedule.startMinuteOfDay}-${schedule.endMinuteOfDay}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(schedule);
  });

  // Convert groups to WorkSchedule format
  const result: WorkSchedule[] = [];
  grouped.forEach((schedules) => {
    const startHour = schedules[0].startMinuteOfDay;
    const endHour = schedules[0].endMinuteOfDay;
    const weekdays = schedules.map((s) => s.weekday);

    result.push({
      weekdays,
      range: [startHour, endHour],
    });
  });

  return result;
}

/**
 * 檢查 WorkSchedule 陣列中是否存在任何「同一天內重疊」的時段
 * @param schedules 所有的工作時段設定
 * @returns boolean - 若有重疊返回 true，否則 false
 */
export function hasWorkScheduleOverlap(schedules: WorkSchedule[]): boolean {
  // 1. 建立一個 Map 來存放每一天對應到的所有時段
  const dayToRanges = new Map<Weekday, [number, number][]>();

  schedules.forEach((schedule) => {
    schedule.weekdays.forEach((day) => {
      if (!dayToRanges.has(day)) {
        dayToRanges.set(day, []);
      }
      dayToRanges.get(day)!.push(schedule.range);
    });
  });

  // 2. 遍歷每一天，檢查該天內的所有時段是否有交集
  for (const ranges of dayToRanges.values()) {
    // 如果這天只有一個時段，不可能重疊
    if (ranges.length <= 1) continue;

    // 依據起始時間排序時段
    const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);

    // 檢查「當前時段的開始」是否小於「前一個時段的結束」
    for (let i = 1; i < sortedRanges.length; i++) {
      const prevEnd = sortedRanges[i - 1][1];
      const currentStart = sortedRanges[i][0];

      if (currentStart < prevEnd) {
        return true; // 偵測到重疊
      }
    }
  }

  return false;
}
