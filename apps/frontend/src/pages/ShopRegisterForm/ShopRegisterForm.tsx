import { Check, Ellipsis, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FormHeader from "./FormHeader";
import ShopTitleBlock from "./ShopTitleBlock";
import ShopDescriptionBlock from "./ShopDescriptionBlock";
import ShopPhoneNumbersBlock from "./ShopPhoneNumbersBlock";
import ShopImagesBlock from "./ShopImagesBlock";
import ShopLocationBlock from "./ShopLocationBlock";
import ShopWorkSchedulesBlock, {
  type Weekday,
  type WorkSchedule,
  DEFAULT_WORKSCHEDULE,
  getChineseWeekdayName,
  weekdayOrder,
} from "./ShopWorkSchedulesBlock";
import type { SelectedImage } from "../../types/selectedImage";

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
  const [images, setImages] = useState<SelectedImage[]>([]); // 用 base64 URL 預覽

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
        <div className="max-w-xl w-full p-4 space-y-4">
          <FormHeader />

          <ShopTitleBlock title={title} setTitle={setTitle} />

          <ShopDescriptionBlock
            description={description}
            setDescription={setDescription}
          />

          <ShopPhoneNumbersBlock
            phoneNumbers={phoneNumbers}
            setPhoneNumbers={setPhoneNumbers}
          />

          <ShopImagesBlock images={images} setImages={setImages} />

          <ShopLocationBlock />

          <ShopWorkSchedulesBlock
            workSchedules={workSchedules}
            setWorkSchedules={setWorkSchedules}
            setWorkScheduleIndex={setWorkScheduleIndex}
          />

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
