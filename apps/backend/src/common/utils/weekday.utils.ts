import { Weekday } from 'src/shop-draft/dto/shop-draft.dto';

export const weekdayOrder: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const getChineseWeekdayName = (weekday: Weekday): string => {
  const zhMap: Record<Weekday, string> = {
    SUNDAY: '週日',
    MONDAY: '週一',
    TUESDAY: '週二',
    WEDNESDAY: '週三',
    THURSDAY: '週四',
    FRIDAY: '週五',
    SATURDAY: '週六',
  };

  return zhMap[weekday];
};

export const formatWeekdays = (weekdays: Weekday[]): string => {
  // sort by actual weekday order
  const sorted = [...weekdays].sort(
    (a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b),
  );

  const ranges: string[] = [];
  let startIdx = 0;

  for (let i = 1; i <= sorted.length; i++) {
    const prev = weekdayOrder.indexOf(sorted[i - 1]);
    const curr = weekdayOrder.indexOf(sorted[i]);
    // if not consecutive or reached end
    if (i === sorted.length || curr !== prev + 1) {
      const group = sorted.slice(startIdx, i);
      if (group.length >= 3) {
        ranges.push(
          `${getChineseWeekdayName(group[0])} ~ ${getChineseWeekdayName(
            group[group.length - 1],
          )}`,
        );
      } else {
        ranges.push(group.map((d) => getChineseWeekdayName(d)).join('、'));
      }
      startIdx = i;
    }
  }

  // combine ranges — use 、 between single days or short groups,
  // use ， between separate ranges
  return ranges.join('，');
};
