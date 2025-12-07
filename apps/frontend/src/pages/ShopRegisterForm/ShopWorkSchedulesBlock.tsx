import { useState, type Dispatch } from "react";
import QuestionBlock from "./QuestionBlock";
import { Trash, Plus, Check, CircleAlert } from "lucide-react";
import DoubleSlider from "../../widgets/RangeSlider";
import {
  weekdayOrder,
  getChineseWeekdayName,
  DEFAULT_WORKSCHEDULE,
} from "../../types/shop";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { formatWeekdays } from "../../utils/formatWeekdays";
import type { Weekday, WorkSchedule } from "../../types/workSchedule";

const WeekdaySelector = ({
  defaultValue,
  selectedWeekdays,
  setNewWeekday,
  onClose,
}: {
  defaultValue: Weekday[];
  selectedWeekdays: Weekday[];
  setNewWeekday: (newValue: Weekday[]) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState(defaultValue);

  const toggleSelection = (weekday: Weekday) => {
    if (selectedWeekdays.includes(weekday) && !defaultValue.includes(weekday))
      return;
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
                selected.includes(weekday)
                  ? ""
                  : selectedWeekdays.includes(weekday) &&
                    !defaultValue.includes(weekday)
                  ? "opacity-30"
                  : "opacity-0"
              }`}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
          </button>
        ))}
      </div>

      <form method="dialog" className="space-y-2">
        {/* if there is a button in form, it will close the modal */}
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
  const { showToast } = useToast();

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
      const hour = Math.floor(time / 60);
      const minute = time - hour * 60;
      const formattedHour = String(hour).padStart(2, "0");
      const formattedMin = String(minute).padStart(2, "0");
      return `${formattedHour}:${formattedMin}`;
    };

    return `${formatTime(range[0])} ~ ${formatTime(range[1])}`;
  };

  const addWorkSchedule = () => {
    if (selectedWeekdays().length >= 7) {
      showToast({
        title: "所有工作日皆已選擇",
        icon: <CircleAlert className="text-error" />,
      });
      return;
    }
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

  const setWeekdays = (newValue: Weekday[], index: number) => {
    if (index < 0 || index >= workSchedules.length) return;

    const newSchedule = { ...workSchedules[index], weekdays: newValue };

    const newWorkSchedules = [...workSchedules];
    newWorkSchedules[index] = newSchedule;

    setWorkSchedules(newWorkSchedules);
  };

  const resetSelectedIndex = () =>
    // 300 ms for animation duration
    setTimeout(() => {
      setWorkScheduleIndex(undefined);
    }, 300);

  const selectedWeekdays = () => {
    return workSchedules.flatMap((w) => w.weekdays);
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
              selectedWeekdays={selectedWeekdays()}
              setNewWeekday={(newValue) =>
                setWeekdays(newValue, workScheduleIndex)
              }
              onClose={resetSelectedIndex}
            />
          )}
        </dialog>
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
              max={1440}
              step={30}
              defaultValue={[240, 510]}
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
