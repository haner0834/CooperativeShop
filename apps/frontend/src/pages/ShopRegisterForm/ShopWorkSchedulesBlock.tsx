import { useState, type Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Trash, Plus, Check, AlertTriangle } from "lucide-react";
import DoubleSlider from "../../widgets/RangeSlider";
import {
  weekdayOrder,
  getChineseWeekdayName,
  DEFAULT_WORKSCHEDULE,
} from "../../types/shop";
import { formatWeekdays } from "../../utils/formatWeekdays";
import type { Weekday, WorkSchedule } from "../../types/workSchedule";

// Helper: Check if two time ranges overlap
const isRangeOverlapping = (
  range1: [number, number],
  range2: [number, number]
) => {
  return Math.max(range1[0], range2[0]) < Math.min(range1[1], range2[1]);
};

const WeekdaySelector = ({
  defaultValue,
  setNewWeekday,
  onClose,
}: {
  defaultValue: Weekday[];
  // Removed selectedWeekdays prop as we no longer block used weekdays
  setNewWeekday: (newValue: Weekday[]) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState(defaultValue);

  const toggleSelection = (weekday: Weekday) => {
    // Logic simplified: Just toggle local state, don't care about other blocks
    if (selected.includes(weekday)) {
      const newSelected = [...selected].filter((w) => w !== weekday);
      setSelected(newSelected);
    } else {
      setSelected([...selected, weekday]);
    }
  };

  const cancel = async () => {
    onClose();
  };

  const finish = () => {
    setNewWeekday(selected);
    setTimeout(onClose, 0);
  };

  return (
    <div className="modal-box space-y-2">
      <h3 className="font-bold flex-1 text-center">編輯工作日</h3>
      <div className="divider" />

      <div className="flex space-x-2 overflow-scroll pb-3">
        {weekdayOrder.map((weekday, i) => (
          <button
            key={`WEEKDAY_SELECTOR_ITEM_${i}`}
            onClick={() => toggleSelection(weekday)}
            className="flex flex-col flex-none items-center rounded-field w-15 p-2 border border-base-300 space-y-2"
          >
            <p className="text-sm">{getChineseWeekdayName(weekday)}</p>

            <div
              className={`p-1 bg-accent rounded-full transition-opacity duration-150 ${
                selected.includes(weekday) ? "" : "opacity-0"
              }`}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
          </button>
        ))}
      </div>

      <form method="dialog" className="space-y-2">
        <button onClick={cancel} className="btn w-full">
          取消
        </button>
        <button onClick={finish} className="btn btn-primary w-full">
          完成
        </button>
      </form>
    </div>
  );
};

const ShopWorkSchedulesBlock = ({
  workSchedules,
  showHint,
  setWorkSchedules,
}: {
  workSchedules: WorkSchedule[];
  showHint: boolean;
  setWorkSchedules: Dispatch<React.SetStateAction<WorkSchedule[]>>;
}) => {
  const [workScheduleIndex, setWorkScheduleIndex] = useState<
    number | undefined
  >(undefined);

  const handleSliderRangeChange = (
    newValue: [number, number],
    index: number
  ) => {
    if (index < 0 || index >= workSchedules.length) return;
    const newSchedule = { ...workSchedules[index], range: newValue };
    const newWorkSchedules = [...workSchedules];
    newWorkSchedules[index] = newSchedule;
    setWorkSchedules(newWorkSchedules);
  };

  const formatWorkScheduleRange = (range: [number, number]): string => {
    const formatTime = (time: number): string => {
      const hour = Math.floor(time / 60);
      const minute = time - hour * 60;
      const formattedHour = String(hour).padStart(2, "0");
      const formattedMin = String(minute).padStart(2, "0");
      return `${formattedHour}:${formattedMin}`;
    };
    return `${formatTime(range[0])} ~ ${formatTime(range[1])}`;
  };

  const addWorkSchedule = () => {
    // Removed the "all 7 days selected" check because duplicate days are now allowed
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
    setTimeout(() => {
      const modal = document.getElementById(
        "my_modal_1"
      ) as HTMLDialogElement | null;
      modal?.showModal();
    }, 0);
  };

  const setWeekdays = (newValue: Weekday[], index: number) => {
    if (index < 0 || index >= workSchedules.length) return;
    const newSchedule = { ...workSchedules[index], weekdays: newValue };
    const newWorkSchedules = [...workSchedules];
    newWorkSchedules[index] = newSchedule;
    setWorkSchedules(newWorkSchedules);
  };

  const resetSelectedIndex = () =>
    setTimeout(() => {
      setWorkScheduleIndex(undefined);
    }, 300);

  const selectedWeekdays = () => {
    return workSchedules.flatMap((w) => w.weekdays);
  };

  // Check overlap for a specific block index
  const getOverlapWarning = (currentIndex: number) => {
    const current = workSchedules[currentIndex];

    // Check against all other blocks
    for (let i = 0; i < workSchedules.length; i++) {
      if (i === currentIndex) continue;
      const other = workSchedules[i];

      // 1. Find common weekdays
      const commonDays = current.weekdays.filter((d) =>
        other.weekdays.includes(d)
      );

      // 2. If common weekdays exist, check time overlap
      if (commonDays.length > 0) {
        if (isRangeOverlapping(current.range, other.range)) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <QuestionBlock
      title="營業時間"
      status={selectedWeekdays().length >= 1 ? "ok" : "required"}
      hint="工作日尚未指定"
      showHint={showHint}
    >
      <>
        <dialog id="my_modal_1" className="modal">
          {workScheduleIndex !== undefined && (
            <WeekdaySelector
              defaultValue={workSchedules[workScheduleIndex].weekdays}
              setNewWeekday={(newValue) =>
                setWeekdays(newValue, workScheduleIndex)
              }
              onClose={resetSelectedIndex}
            />
          )}
        </dialog>
        <div className="space-y-4">
          {workSchedules.map((workSchedule, i) => {
            const hasOverlap = getOverlapWarning(i);

            return (
              <div
                key={`WORK_SCHEDULE_BLOCK_${i}`}
                className={`rounded-field w-full p-2 border flex flex-col space-y-4 transition-colors ${
                  hasOverlap ? "border-error bg-error/5" : "border-base-300"
                }`}
              >
                <div className="flex justify-between items-center space-x-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(i)}
                      className="btn btn-sm btn-ghost border border-base-300"
                    >
                      {formatWeekdays(workSchedule.weekdays) || "尚未選擇"}
                    </button>

                    {/* Overlap Warning Badge */}
                    {hasOverlap && (
                      <div
                        className="tooltip tooltip-right"
                        data-tip="同一天內工作時段不可重疊"
                      >
                        <div className="flex items-center gap-1 text-xs text-error font-medium animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="hidden sm:inline">時段重疊</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {workSchedules.length > 1 && (
                    <button
                      onClick={() => removeWorkSchedule(i)}
                      className="btn btn-xs btn-square"
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
                  max={1440}
                  step={30}
                  defaultValue={workSchedule.range}
                  onChange={(newValue) => handleSliderRangeChange(newValue, i)}
                />
                <div className="flex justify-between">
                  {[0, 6, 12, 18, 24].map((num, i) => (
                    <p
                      key={`RANGE_SLIDER_LABEL_${i}`}
                      className="text-xs opacity-50"
                    >
                      {num}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={addWorkSchedule}
            className="w-full btn btn-soft btn-primary"
          >
            <Plus className="w-4 h-4" /> 新增時段
          </button>
        </div>
      </>
    </QuestionBlock>
  );
};

export default ShopWorkSchedulesBlock;
