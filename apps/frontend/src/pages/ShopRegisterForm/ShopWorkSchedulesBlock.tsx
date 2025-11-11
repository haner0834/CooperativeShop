import type { Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Trash, Plus } from "lucide-react";
import DoubleSlider from "../../widgets/RangeSlider";

export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface WorkSchedule {
  weekdays: Weekday[];
  range: [number, number];
}

export const DEFAULT_WORKSCHEDULE: WorkSchedule = {
  weekdays: [],
  range: [8, 17],
};

export const weekdayOrder: Weekday[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const getChineseWeekdayName = (weekday: Weekday): string => {
  const zhMap: Record<Weekday, string> = {
    SUN: "週日",
    MON: "週一",
    TUE: "週二",
    WED: "週三",
    THU: "週四",
    FRI: "週五",
    SAT: "週六",
  };

  return zhMap[weekday];
};

const ShopWorkSchedulesBlock = ({
  workSchedules,
  setWorkSchedules,
  setWorkScheduleIndex,
}: {
  workSchedules: WorkSchedule[];
  setWorkSchedules: Dispatch<React.SetStateAction<WorkSchedule[]>>;
  setWorkScheduleIndex: Dispatch<React.SetStateAction<number | undefined>>;
}) => {
  const handleSliderRangeChange = (
    newValue: [number, number],
    index: number
  ) => {
    if (index < 0 || index >= workSchedules.length) return;

    // Use shallow copy to prevent modifying whole array
    const newSchedule = { ...workSchedules[index], range: newValue };

    const newWorkSchedules = [...workSchedules];
    newWorkSchedules[index] = newSchedule;

    setWorkSchedules(newWorkSchedules);
  };

  const formatWorkScheduleRange = (range: [number, number]): string => {
    const formatTime = (time: number): string => {
      const hour = Math.floor(time);
      const minute = (time - hour) * 60;
      return `${hour}:${minute === 0 ? "00" : "30"}`;
    };

    return `${formatTime(range[0])} ~ ${formatTime(range[1])}`;
  };

  const formatWeekdays = (weekdays: Weekday[]): string => {
    // sort by actual weekday order
    const sorted = [...weekdays].sort(
      (a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b)
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
              group[group.length - 1]
            )}`
          );
        } else {
          ranges.push(group.map((d) => getChineseWeekdayName(d)).join("、"));
        }
        startIdx = i;
      }
    }

    // combine ranges — use 、 between single days or short groups,
    // use ， between separate ranges
    return ranges.join("，");
  };

  const addWorkSchedule = () => {
    // TODO: Add a used-weekdays checker
    const newSchedule = { ...DEFAULT_WORKSCHEDULE };
    setWorkSchedules([...workSchedules, newSchedule]);
  };

  const removeWorkSchedule = (index: number) => {
    if (index < 0 || index >= workSchedules.length) return;

    const newWorkSchedules = workSchedules.filter((_, i) => i !== index);

    setWorkSchedules(newWorkSchedules);
  };

  const openModal = (index: number) => {
    setWorkScheduleIndex(index);

    // To make these run at the next render to prevent blocking animation
    setTimeout(() => {
      const modal = document.getElementById(
        "my_modal_1"
      ) as HTMLDialogElement | null;
      modal?.showModal();
    }, 0);
  };
  return (
    <QuestionBlock title="營業時間">
      <>
        {workSchedules.map((workSchedule, i) => (
          <div
            key={`WORK_SCHEDULE_BLOCK_${i}`}
            className="rounded-field w-full p-2 border-1 border-base-300 flex flex-col space-y-4"
          >
            <div className="flex justify-between items-center space-x-2">
              <button
                onClick={() => openModal(i)}
                className="btn btn-sm btn-soft btn-primary"
              >
                {formatWeekdays(workSchedule.weekdays) || "尚未選擇"}
              </button>

              {workSchedules.length > 1 && (
                <button
                  onClick={() => removeWorkSchedule(i)}
                  className="btn btn-xs btn-error btn-soft btn-square"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="flex-1 text-sm font-mono">
              時段：{formatWorkScheduleRange(workSchedule.range)}
            </p>

            <DoubleSlider
              min={0}
              max={24}
              step={0.5}
              defaultValue={[8, 17]}
              onChange={(newValue) => handleSliderRangeChange(newValue, i)}
            />
            <div className="flex justify-between">
              {[0, 6, 12, 18, 24].map((num, i) => (
                <p key={`RANGE_SLIDER_LABEL_${i}`} className="text-sm">
                  {num}
                </p>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addWorkSchedule}
          className="w-full btn btn-soft btn-primary"
        >
          <Plus className="w-4 h-4" /> 新增時段
        </button>
      </>
    </QuestionBlock>
  );
};

export default ShopWorkSchedulesBlock;
