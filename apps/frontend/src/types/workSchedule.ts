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
