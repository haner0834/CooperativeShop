import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { weekdayOrder, type Shop } from "../types/shop";
import { testShops } from "./Shops";
import {
  BadgeDollarSign,
  Bookmark,
  ChevronLeft,
  ClipboardCheck,
  ClipboardX,
  Copy,
  ImageOff,
  Map,
  MapPin,
  School,
  Tag,
} from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import ImageGalleryModal from "../widgets/ImageGalleryModal";
// import { path } from "../utils/path";
// import { getErrorMessage } from "../utils/errors";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import { useDevice } from "../widgets/DeviceContext";
import BackButton from "../widgets/BackButton";
import { useToast } from "../widgets/Toast/ToastProvider";
import {
  fromBackendSchedules,
  type WorkSchedule,
  type WorkScheduleBackend,
} from "../types/workSchedule";
import { formatWeekdays } from "../utils/formatWeekdays";

const SaveButton = ({
  style = "circle",
  enable = true,
}: {
  style?: "circle" | "square";
  enable?: boolean;
}) => {
  // btn-circle btn-square
  const [isSaved, setIsSaved] = useState(false);
  const { showToast } = useToast();
  const hintUserTheyreInPreviewMode = () => {
    showToast({
      title: "預覽中無法使用",
      placement: "top-left",
    });
  };
  //   const { id } = useParams();

  useEffect(() => {
    // check();
  }, []);

  const save = async () => {
    if (!enable) {
      hintUserTheyreInPreviewMode();
      return;
    }
    setIsSaved((prev) => !prev);
    // const res = await fetch(path(`/api/shops/${id}/save`), { method: "POST" });
    // const { success, error } = await res.json();
    // if (!success) {
    //   setIsSaved((prev) => !prev);
    //   console.log(error);
    //   showModal({
    //     title: "保存錯誤",
    //     description: getErrorMessage(error.code),
    //     showDismissButton: true,
    //   });
    // }
  };

  //   const check = async () => {
  //     const res = await fetch(path(`/api/shops/${id}/save`));
  //     const { success, body, error } = await res.json();
  //     if (success) {
  //       setIsSaved(body);
  //     } else {
  //       console.log(error);
  //     }
  //   };

  return (
    <button onClick={save} className={`btn btn-${style} select-none`}>
      <Bookmark
        className={`duration-200 ease-in-out transition-color
          ${isSaved ? "fill-neutral" : "fill-transparent"}`}
      />
    </button>
  );
};

interface RangeBlockProps {
  startMinOfDay: number;
  endMinOfDay: number;
  tagAt?: number;
  total?: number; // total range
}

const RangeBlock = ({
  startMinOfDay,
  endMinOfDay,
  tagAt,
  total = 1440,
}: RangeBlockProps) => {
  const start = (startMinOfDay / total) * 100; // %
  const length = ((endMinOfDay - startMinOfDay) / total) * 100; // %
  const tagStart = tagAt ? (tagAt / total) * 100 : null; // %

  const formatMinutesToTime = (minutes: number) => {
    // Ensure the input is within a valid day range (0 to 1439)
    minutes = minutes % 1440;

    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // Determine AM/PM and convert to 12-hour format
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12; // 0 hour should be 12 AM

    // Pad minutes with a leading zero if needed (e.g., 9 becomes 09)
    const formattedMins = mins < 10 ? `0${mins}` : mins;

    return `${hours12}:${formattedMins} ${period}`;
  };

  const formatTimeRange = (startMinOfDay: number, endMinOfDay: number) => {
    const startTime = formatMinutesToTime(startMinOfDay);
    const endTime = formatMinutesToTime(endMinOfDay);

    return `${startTime} ~ ${endTime}`;
  };

  return (
    <div className="relative w-full h-10 bg-base-200 rounded-field">
      <div
        className="absolute flex flex-col items-center justify-center top-0 h-full bg-info/20 rounded-field tooltip"
        data-tip={formatTimeRange(startMinOfDay, endMinOfDay)}
        style={{
          left: `${start}%`,
          width: `${length}%`,
        }}
      >
        <p className="text-blue-500/90 text-sm line-clamp-1">
          {formatTimeRange(startMinOfDay, endMinOfDay)}
        </p>
      </div>

      {tagAt &&
        (tagAt > startMinOfDay && tagAt < endMinOfDay ? (
          <>
            <div
              className="absolute h-3 top-1 -translate-y-1/2 w-1 bg-blue-500/70 rounded"
              style={{ left: `${tagStart!}%` }}
            />
            <div
              className="absolute h-3 bottom-1 translate-y-1/2 w-1 bg-blue-500/70 rounded"
              style={{ left: `${tagStart!}%` }}
            />
          </>
        ) : (
          <div
            className="absolute h-2/3 top-1/2 -translate-y-1/2 w-1 bg-blue-500/70 rounded"
            style={{ left: `${tagStart!}%` }}
          />
        ))}
    </div>
  );
};

const WorkScheduleDisplayer = ({
  workSchedulesBackend,
}: {
  workSchedulesBackend: WorkScheduleBackend[] | undefined;
}) => {
  const getCurrentMinOfDay = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return h * 60 + m;
  };

  const getCurrentWeekday = () => {
    const today = new Date();
    const standardIndex = today.getDay();

    // Calculate the adjusted index (Monday = 0, Sunday = 6)
    // We add 6 to move Sunday (0) to index 6, then use modulo 7 to wrap the others correctly.
    const mondayBasedIndex = (standardIndex + 6) % 7;
    return weekdayOrder[mondayBasedIndex];
  };

  if (!workSchedulesBackend) return null;

  const workSchedules: WorkSchedule[] = (() => {
    return fromBackendSchedules(workSchedulesBackend);
  })();

  return (
    <ul className="space-y-4">
      {workSchedules &&
        workSchedules.map((workSchedule, i) => (
          <li
            className="flex flex-col space-x-4 space-y-2 whitespace-nowrap p-4 border border-base-300 rounded-box shadow-xs"
            key={`WORK_SCHEDULE_${i}`}
          >
            <p className="flex-1">{formatWeekdays(workSchedule.weekdays)}</p>

            <RangeBlock
              startMinOfDay={workSchedule.range[0]}
              endMinOfDay={workSchedule.range[1]}
              tagAt={
                workSchedule.weekdays.includes(getCurrentWeekday())
                  ? getCurrentMinOfDay()
                  : undefined
              }
            />

            <div className="flex-1 flex justify-between">
              {[0, 6, 12, 18, 24].map((num, i) => (
                <p
                  key={`RANGE_SLIDER_LABEL_${i}`}
                  className="text-xs opacity-50"
                >
                  {num}
                </p>
              ))}
            </div>
          </li>
        ))}
    </ul>
  );
};

export const ShopDetailContent = ({
  shop,
  isPreview = false,
}: {
  shop: Shop | null;
  isPreview?: boolean;
}) => {
  const { isMobile } = useDevice();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const { showToast } = useToast();

  // 可以監聽 hash 變化，更新 activeIndex
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash.replace("#", "");
      const index = parseInt(hash);
      if (!isNaN(index)) setActiveIndex(index);
    }

    window.addEventListener("hashchange", onHashChange);

    // 初始化
    onHashChange();

    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openModal = (index: number) => {
    setInitialImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToItem = (hash: string) => {
    window.location.replace(window.location.pathname + hash);
  };

  const copyText = async (textToCopy: string | undefined) => {
    try {
      if (!textToCopy) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        title: "已複製地址",
        icon: <ClipboardCheck className="text-success" />,
        replace: true,
      });
    } catch (err) {
      showToast({
        title: "複製失敗",
        icon: <ClipboardX className="text-error" />,
        replace: true,
      });
    }
  };

  useEffect(() => {}, []);

  return (
    // SEO: Added itemScope and itemType for Schema.org Structured Data
    <article itemScope itemType="https://schema.org/Store">
      <div className="navbar bg-base-100 shadow-sm z-50 h-18 fixed overflow-hidden">
        <div className="navbar-start">
          <Logo className="h-10 w-auto hidden sm:block" />

          <div className="sm:hidden">
            <BackButton />
          </div>
        </div>

        <div className="navbar-center"></div>

        <div className="navbar-end">
          <div className="md:hidden">
            <SaveButton enable={!isPreview} />
          </div>
        </div>
      </div>

      <Sidebar isOpen={false}>
        <SidebarContent disabled={isPreview} />
      </Sidebar>

      <div className={"pt-18 min-h-screen w-full lg:ps-64 pb-20"}>
        <div className="hidden sm:block">
          <a
            // href="/shops"
            className="btn btn-ghost btn-xs ms-4 mt-4 opacity-70"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </a>
        </div>
        <div
          className={
            isMobile ? "" : " flex flex-wrap justify-center lg:justify-start"
          }
        >
          {isMobile ? (
            <>
              {/* TODO: Replace this with custom carousel,
                    for better customization and fix hashtag sync issue */}
              <div className="carousel w-full aspect-[4/3]">
                {shop?.imageLinks.length === 0 ? (
                  <div
                    className={`w-full h-full bg-base-300 flex flex-col justify-center items-center ${
                      isPreview ? "text-error" : ""
                    }`}
                  >
                    <ImageOff className="w-12 h-12" />
                    <p className="opacity-60 text-sm">沒有圖片</p>
                  </div>
                ) : (
                  shop?.imageLinks.map((link, i) => (
                    <div
                      key={i}
                      id={String(i)}
                      className="carousel-item w-full overflow-clip"
                    >
                      {/* SEO: Added alt text and itemProp */}
                      <LazyLoadImage
                        src={link}
                        alt={`${shop?.title || "商家"} - 照片 ${i + 1}`}
                        itemProp="image"
                        onClick={() => openModal(i)}
                        className="carousel-item w-full object-cover cursor-pointer"
                        placeholder={<div className="w-full skeleton" />}
                      />
                    </div>
                  ))
                )}
              </div>
              <div className="flex w-full justify-center gap-2 py-2">
                {shop?.imageLinks.map((_, i) => (
                  <a
                    key={i}
                    onClick={() => goToItem(`#${i}`)}
                    className={`btn btn-xs btn-soft ${
                      activeIndex === i ? "btn-primary" : ""
                    }`}
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            </>
          ) : shop?.imageLinks.length === 0 ? (
            <div
              className={`w-120 h-120 mt-4 ms-4 bg-base-300 rounded-field flex flex-col justify-center items-center text-accent ${
                isPreview ? "text-error" : ""
              }`}
            >
              <ImageOff className={`w-12 h-12`} />
              <p className="opacity-60 text-sm">沒有圖片</p>
            </div>
          ) : (
            <div className="ms-4 mt-4 flex">
              <div>
                {(shop?.imageLinks.length ?? 0) > 0 && (
                  // SEO: Added alt text and itemProp
                  <img
                    src={shop?.imageLinks[activeIndex]}
                    alt={`${shop?.title || "商家"} - 主照片`}
                    itemProp="image"
                    onClick={() => openModal(activeIndex)}
                    className="w-120 rounded-field"
                  />
                )}
                <div className="flex overflow-x-scroll mt-2 space-x-2">
                  {shop?.imageLinks.map((link, i) => (
                    <a
                      key={i}
                      onClick={() => goToItem(`#${i}`)}
                      className="relative w-20 h-20"
                    >
                      {/* SEO: Added alt text */}
                      <img
                        src={link}
                        alt={`${shop?.title || "商家"} - 縮圖 ${i + 1}`}
                        className="w-full h-full absolute rounded-field object-cover"
                      />
                      <div className="w-full h-full rounded-field transition-colors duration-200 ease-in-out absolute hover:bg-neutral/30" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col ms-4">
                <SaveButton style="square" enable={!isPreview} />
              </div>
            </div>
          )}
          {/* Image Gallery Modal */}
          {shop?.imageLinks && (
            <ImageGalleryModal
              imageLinks={shop.imageLinks}
              initialIndex={initialImageIndex}
              isOpen={isModalOpen}
              onClose={closeModal}
            />
          )}

          <div
            className={
              "mx-4 mt-4 space-y-4 flex flex-col " +
              (isMobile ? "" : "min-w-130 lg:w-100")
            }
          >
            {/* SEO: Added itemProp for name */}
            <h1 className="font-bold text-2xl" itemProp="name">
              {shop?.title || "空的 :("}
            </h1>
            {isPreview && !shop?.title && (
              <span className="text-error -mt-4 text-sm">缺少商家名稱</span>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="badge badge-soft badge-success uppercase">
                <Tag className="w-4 h-4" /> open
              </span>
              <a href="">
                <span className="badge badge-soft badge-warning uppercase">
                  <School className="w-4 h-4" />
                  KMSH
                </span>
              </a>
            </div>

            {/* SEO: Changed div to section to define pricing/discount section contextually */}
            <section className="relative bg-base-300 border-base-300 rounded-box w-full border p-4 pt-2">
              <legend className="uppercase absolute -top-2 text-xs font-semibold">
                折扣
              </legend>

              <div className="flex items-center space-x-2 pt-2">
                <BadgeDollarSign className={`text-blue-400`} />

                <p className="text-base">{shop?.discount ?? "沒有折扣"}</p>
              </div>
            </section>

            {/* SEO: Changed to address tag, added itemProp. 'not-italic' ensures no visual change. */}
            <address
              className={`flex space-x-2 not-italic items-center ${
                isPreview && !shop?.address ? "text-error" : ""
              }`}
              itemProp="address"
            >
              <MapPin />{" "}
              <span className="">
                {shop?.address || (isPreview ? "缺少地址" : "")}
              </span>
              <button
                className="btn btn-xs"
                onClick={() => copyText(shop?.address)}
                aria-label="複製地址" // Accessibility: Added aria-label
              >
                <Copy className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </address>

            <a className="btn btn-primary btn-soft rounded-full w-full md:hidden">
              <Map /> 在地圖中打開
            </a>

            {/* SEO: Changed div to h2 for document outline, kept divider class for visuals */}
            <h2 className="divider divider-start text-neutral/50 text-xs">
              商家介紹
            </h2>

            {/* SEO: Added itemProp for description */}
            <p itemProp="description">{shop?.description}</p>
            {isPreview && !shop?.description && (
              <span className="text-error text-sm">缺少商家介紹</span>
            )}

            {/* SEO: Changed div to h2 for document outline */}
            <h2 className="divider divider-start mt-0 text-neutral/50 text-xs">
              工作時段
            </h2>

            <div>
              <WorkScheduleDisplayer
                workSchedulesBackend={shop?.workSchedules}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const ShopDetail = () => {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    const shop = testShops.find((s) => s.id === id);
    if (shop) setShop(shop);
  }, []);

  return <ShopDetailContent shop={shop} />;
};

export default ShopDetail;
