import {
  Check,
  Ellipsis,
  Menu,
  Minus,
  Phone,
  Plus,
  Trash,
  Upload,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import AdaptiveTextArea from "../widgets/AdaptiveTextArea";
import DoubleSlider from "../widgets/RangeSlider";
import { useSearchParams } from "react-router-dom";

type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

interface WorkSchedule {
  weekdays: Weekday[];
  range: [number, number];
}

const DEFAULT_WORKSCHEDULE: WorkSchedule = {
  weekdays: [],
  range: [8, 17],
};

const weekdayOrder: Weekday[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

const getChineseName = (weekday: Weekday): string => {
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

const QuestionBlock = ({
  title = "",
  description = "",
  status = "required",
  children = null,
}: {
  title?: string;
  description?: string;
  status?: "required" | "optional" | null;
  children?: ReactNode;
}) => {
  return (
    <div className="w-full bg-base-100 rounded-box p-4 space-y-2">
      <div>
        <div className="flex items-center">
          <h2 className="font-bold text-lg flex-1">{title}</h2>
          {status && (
            <div
              aria-label={status + " question"}
              className={
                "status flex-none " +
                (status === "required" ? "status-error" : "status-info")
              }
            ></div>
          )}
        </div>

        {description && <p className="opacity-50 text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
};

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <Menu />
        </button>
      </div>
      <div className="flex-1 text-center">
        <a className="text-base font-semibold">特約商家註冊</a>
      </div>
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <Ellipsis />
        </button>
      </div>
    </div>
  );
};

const WeekdaySelector = ({
  defaultValue,
  setNewWeekday,
  onClose,
}: {
  defaultValue: Weekday[];
  setNewWeekday: (newValue: Weekday[]) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState(defaultValue);

  const toggleSelection = (weekday: Weekday) => {
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
    // setTimeout(onClose, 0);
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
            <p className="text-sm">{getChineseName(weekday)}</p>

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

const ShopRegisterForm = () => {
  const [title, setTitle] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [description, setDescription] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState([""] as string[]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([
    DEFAULT_WORKSCHEDULE,
  ]);
  const [workScheduleIndex, setWorkScheduleIndex] = useState<
    number | undefined
  >(undefined);

  const addPhoneNumber = () => {
    if (phoneNumbers.length < 5) {
      setPhoneNumbers([...phoneNumbers, ""]);
    }
  };

  const formatTaiwanPhone = (num: string) => {
    if (num.startsWith("09") && num.length === 10) {
      return num.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    } else if (num.startsWith("0800") && num.length === 10) {
      return num.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    } else if (/^0\d{1,2}/.test(num)) {
      return num.replace(/(\d{2,3})(\d{3,4})(\d{3,4})/, "$1-$2-$3");
    }
    return num;
  };

  const updatePhoneNumber = (index: number, newValue: string) => {
    if (index < 0 || index >= phoneNumbers.length) return;

    // 過濾非數字
    const digits = newValue.replace(/\D/g, "");

    const newPhoneNumbers = [...phoneNumbers];
    newPhoneNumbers[index] = digits;

    setPhoneNumbers(newPhoneNumbers);
  };

  const removePhoneNumber = (index: number) => {
    if (index < 0 || index >= phoneNumbers.length) return;

    const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index);

    setPhoneNumbers(newPhoneNumbers);
  };

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
            `${getChineseName(group[0])} ~ ${getChineseName(
              group[group.length - 1]
            )}`
          );
        } else {
          ranges.push(group.map((d) => getChineseName(d)).join("、"));
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

  const setWeekdays = (newValue: Weekday[], index: number) => {
    if (index < 0 || index >= workSchedules.length) return;

    const newSchedule = { ...workSchedules[index], weekdays: newValue };

    const newWorkSchedules = [...workSchedules];
    newWorkSchedules[index] = newSchedule;

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

  const resetSelectedIndex = () =>
    // 300 ms for animation duration
    setTimeout(() => {
      setWorkScheduleIndex(undefined);
    }, 300);

  useEffect(() => {
    if (!searchParams.get("id")) {
      const id = crypto.randomUUID();
      searchParams.set("id", id);
      setSearchParams(searchParams, { replace: true });
    }

    // read data if existed
    const draft = localStorage.getItem("SHOP_DRAFT_" + searchParams.get("id"));
    if (draft) {
      const shop = JSON.parse(draft);
      setTitle(shop.title);
      setDescription(shop.description);
      setPhoneNumbers(shop.phoneNumbers);
      setWorkSchedules(shop.workSchedules);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const handler = setTimeout(() => {
      const shop = { title, description, phoneNumbers, workSchedules };
      localStorage.setItem("SHOP_DRAFT_" + id, JSON.stringify(shop));
    }, 1000); // ← delay 1s

    return () => clearTimeout(handler); // ← Cancel the previous timer (to prevent duplicate storage).
  }, [title, description, phoneNumbers, workSchedules]);

  return (
    <div className="select-none md:select-auto">
      <Navbar />

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

      <main className="pt-18 min-h-screen bg-base-300 flex justify-center">
        <div className="max-w-xl flex-1 p-4 space-y-4">
          <QuestionBlock title="特約商家註冊" status={null}>
            <div className="text-neutral/50 text-sm">
              在以下問題中，右上角有{" "}
              <div
                aria-label="optional question"
                className="status status-info"
              ></div>{" "}
              代表的是非必填問題，而{" "}
              <div
                aria-label="required question"
                className="status status-error"
              ></div>{" "}
              為必填問題。所有操作都將自動保存。
            </div>
          </QuestionBlock>

          <QuestionBlock title="店家名稱">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="塔↘吉 摩ˇ洛哥料理"
              className="input w-full"
            />
          </QuestionBlock>

          <QuestionBlock
            title="描述"
            description="對店家的簡短介紹，介於 100 至 500 字。"
          >
            <AdaptiveTextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="來吃塔↘吉 :D"
              className="textarea w-full"
            ></AdaptiveTextArea>
          </QuestionBlock>

          <QuestionBlock title="電話號碼" description="至多填寫 5 個電話號碼。">
            <div className="space-y-4 transition-all duration-300">
              {phoneNumbers.map((phoneNumber, i) => (
                <div
                  key={`PHONE_NUM_${i}`}
                  className="flex items-center space-x-2"
                >
                  <div className="flex flex-col w-full">
                    <label className="input w-full">
                      <Phone className="opacity-80" />
                      <input
                        type="tel"
                        value={formatTaiwanPhone(phoneNumber)}
                        onChange={(e) => updatePhoneNumber(i, e.target.value)}
                        placeholder="0987654321"
                        className="tabular-nums"
                        minLength={9 + 3} // 9 phone num + "-" * 3
                      />
                    </label>
                  </div>

                  {phoneNumbers.length > 1 && (
                    <button
                      className="btn btn-xs btn-error btn-circle btn-soft"
                      onClick={() => removePhoneNumber(i)}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                className="btn btn-soft btn-primary w-full"
                disabled={phoneNumbers.length >= 5}
                onClick={addPhoneNumber}
              >
                <Plus className="h-5 w-5" /> 新增電話
              </button>
            </div>
          </QuestionBlock>

          <QuestionBlock title="圖片">
            <div className="overflow-x-scroll">
              <div className="bg-base-300 w-40 aspect-square rounded-field flex flex-col items-center justify-center space-y-1">
                <div className="p-2 bg-neutral/10 rounded-full">
                  <Upload className="text-base-100" />
                </div>
                <p className="text-sm">上傳照片</p>
              </div>
            </div>
          </QuestionBlock>

          <QuestionBlock title="地點">
            <input
              type="text"
              className="input w-full"
              placeholder="輸入地址"
            />

            <div className="flex space-x-1 p-1 bg-base-300 rounded-xl">
              <button className="btn flex-1 bg-base-100">從地圖選擇</button>
              <button className="btn flex-1 opacity-30">使用當前位置</button>
            </div>

            <p className="text-sm opacity-50">由地圖中選擇一個對應的地點</p>

            <div className="w-full h-80 bg-base-300 rounded-field"></div>
          </QuestionBlock>

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
                    onChange={(newValue) =>
                      handleSliderRangeChange(newValue, i)
                    }
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

          <div className="flex space-x-4">
            <button className="btn flex-1">預覽</button>
            <button className="btn btn-primary flex-1">提交</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopRegisterForm;
