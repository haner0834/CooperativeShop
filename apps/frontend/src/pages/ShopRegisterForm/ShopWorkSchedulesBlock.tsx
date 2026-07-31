import { useState, type Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Trash, Plus, Check, AlertTriangle, Ellipsis } from "lucide-react";
import DoubleSlider from "../../widgets/RangeSlider";
import {
  weekdayOrder,
  getChineseWeekdayName,
  DEFAULT_WORKSCHEDULE,
} from "../../types/shop";
import { formatWeekdays } from "../../utils/formatWeekdays";
import {
  hasWorkScheduleOverlap,
  type Weekday,
  type WorkSchedule,
  type WorkScheduleType,
} from "../../types/workSchedule";

// Helper: Check if two time ranges overlap
const isRangeOverlapping = (
  range1: [number, number],
  range2: [number, number]
) => {
  return Math.max(range1[0], range2[0]) < Math.min(range1[1], range2[1]);
};

const WeekdaySelector = ({
  defaultSchedule,
  setNewSchedule,
  onClose,
}: {
  defaultSchedule: WorkSchedule;
  // Removed selectedWeekdays prop as we no longer block used weekdays
  setNewSchedule: (newValue: WorkSchedule) => void;
  onClose: () => void;
}) => {
  const [selectedWeekdays, setSelectedWeeks] = useState(
    defaultSchedule.weekdays
  );
  const [type, setType] = useState<WorkScheduleType>(
    defaultSchedule.type ?? "FIXED"
  );
  const [note, setNote] = useState(defaultSchedule.scheduleNote);

  const toTimeStr = (totalMins: number) => {
    const min = totalMins % 60;
    const hr = (totalMins - min) / 60; // must be int

    const minPadStr = min.toString().padStart(2, "0");
    const hrPadStr = hr.toString().padStart(2, "0");
    const str = `${hrPadStr}:${minPadStr}`;
    return str;
  };

  const [startTimeVal, setStartTimeVal] = useState(
    toTimeStr(defaultSchedule.range[0])
  );
  const [endTimeVal, setEndTimeVal] = useState(
    toTimeStr(defaultSchedule.range[1])
  );

  // 將 "HH:mm" 轉換為總分鐘數
  const normalizeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hr, min] = timeStr.split(":").map(Number);
    return hr * 60 + min;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value > endTimeVal) return;
    setStartTimeVal(value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value < startTimeVal) return;
    setEndTimeVal(value);
  };

  // const handleRemoveStartTime = () => {};

  // const handleRemoveEndTime = () => {};

  const toggleSelection = (weekday: Weekday) => {
    // Logic simplified: Just toggle local state, don't care about other blocks
    if (selectedWeekdays.includes(weekday)) {
      const newSelected = [...selectedWeekdays].filter((w) => w !== weekday);
      setSelectedWeeks(newSelected);
    } else {
      setSelectedWeeks([...selectedWeekdays, weekday]);
    }
  };

  const cancel = async () => {
    onClose();
  };

  const finish = () => {
    setNewSchedule({
      ...defaultSchedule,
      range: [normalizeToMinutes(startTimeVal), normalizeToMinutes(endTimeVal)],
      weekdays: selectedWeekdays,
      type: type,
      scheduleNote: note,
    });
    setTimeout(onClose, 0);
  };

  return (
    <div className="modal-box space-y-2">
      <h3 className="font-bold flex-1 text-center">營業時間詳情</h3>

      <div className="flex gap-2 justify-center items-center">
        <p className="text-xs font-medium opacity-50">基本設定</p>
        <div className="divider flex-1 my-0" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex w-full justify-between">
          <p>彈性時間</p>

          <input
            type="checkbox"
            className="toggle bg-base-content/20 border-base-300 text-base-100 checked:bg-success checked:border-base-100"
            checked={type === "FLEXIBLE"}
            onChange={(e) => setType(e.target.checked ? "FLEXIBLE" : "FIXED")}
            name="is_flexible_schedule"
          />
        </div>

        {type === "FLEXIBLE" && (
          <div className="flex flex-col w-full justify-between">
            <div className="w-full">
              <p className="text-sm opacity-50">彈性時段說明</p>
              <input
                type="text"
                value={note ?? ""}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border-b-2 border-gray-300 focus:border-black focus:outline-none rounded-none py-1"
                placeholder="例：售完為止"
              />
            </div>
          </div>
        )}

        <div className="flex w-full justify-between items-center gap-2">
          <p className="flex-1">開始時間</p>

          <input
            type="time"
            value={startTimeVal}
            onChange={handleStartTimeChange}
            className="input input-sm w-30"
          />

          {/* {type === "FLEXIBLE" && (
            <button
              className="btn btn-circle btn-xs btn-ghost"
              onClick={handleRemoveStartTime}
            >
              <X className="h-4"></X>
            </button>
          )} */}
        </div>

        <div className="flex w-full justify-between items-center gap-2">
          <p className="flex-1">結束時間</p>

          <input
            type="time"
            value={endTimeVal}
            onChange={handleEndTimeChange}
            className="input input-sm w-30"
          />

          {/* {type === "FLEXIBLE" && (
            <button
              className="btn btn-circle btn-xs btn-ghost"
              onClick={handleRemoveEndTime}
            >
              <X className="h-4"></X>
            </button>
          )} */}
        </div>
      </div>

      <div className="flex gap-2 justify-center items-center">
        <p className="text-xs font-medium opacity-50">日期設定</p>
        <div className="divider flex-1 my-0" />
      </div>

      <div className="flex space-x-2 overflow-scroll pb-3">
        {weekdayOrder.map((weekday, i) => (
          <button
            key={`WEEKDAY_SELECTOR_ITEM_${i}`}
            onClick={() => toggleSelection(weekday)}
            className="flex flex-col flex-none items-center rounded-field w-15 p-2 border border-base-300 space-y-2"
          >
            <p className="text-sm">{getChineseWeekdayName(weekday)}</p>

            <div
              className={`p-1 bg-success rounded-full transition-opacity duration-150 ${
                selectedWeekdays.includes(weekday) ? "" : "opacity-0"
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

  const setWeekdays = (newValue: WorkSchedule, index: number) => {
    if (index < 0 || index >= workSchedules.length) return;
    const newSchedule = { ...newValue };
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

  const hasNoOverlap = !hasWorkScheduleOverlap(workSchedules);

  return (
    <QuestionBlock
      title="營業時間"
      status={
        selectedWeekdays().length >= 1 && hasNoOverlap ? "ok" : "required"
      }
      hint={hasNoOverlap ? "工作日尚未指定" : "同一天內時段不可重疊"}
      showHint={showHint}
    >
      <>
        <dialog id="my_modal_1" className="modal">
          {workScheduleIndex !== undefined && (
            <WeekdaySelector
              defaultSchedule={workSchedules[workScheduleIndex]}
              setNewSchedule={(newValue) =>
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
                className={`rounded-field w-full p-2 sm:p-4 border flex flex-col space-y-4 transition-colors ${
                  hasOverlap ? "border-error bg-error/5" : "border-base-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(i)}
                    className="btn btn-sm btn-soft btn-primary"
                  >
                    {formatWeekdays(workSchedule.weekdays) || "尚未選擇"}
                  </button>

                  <div className="flex-1" />
                  <button
                    onClick={() => openModal(i)}
                    className="btn btn-sm btn-square btn-ghost"
                  >
                    <Ellipsis />
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

                  {workSchedules.length > 1 && (
                    <button
                      onClick={() => removeWorkSchedule(i)}
                      className="btn btn-xs btn-square me-1"
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
