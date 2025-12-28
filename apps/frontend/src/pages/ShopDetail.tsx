import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  transformDtoToShop,
  weekdayOrder,
  type ContactInfo,
  type Shop,
} from "../types/shop";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImageOff,
  MapPin,
  Clock,
  School,
  Share2,
  TicketPercent,
  BadgeDollarSign,
  ExternalLink,
  Phone,
  CircleUserRound,
  CircleX,
  UserRoundX,
} from "lucide-react";
import ImageGalleryModal from "../widgets/ImageGalleryModal";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import { useDevice } from "../widgets/DeviceContext";
import { useToast } from "../widgets/Toast/ToastProvider";
import { type Weekday } from "../types/workSchedule";
import { formatWeekdays } from "../utils/formatWeekdays";
import { buildHref, ContactCategoryIcon } from "../utils/contactInfoMap";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import { usePathHistory } from "../contexts/PathHistoryContext";
import axios from "axios";
import { path } from "../utils/path";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import PageMeta, { routesMeta } from "../widgets/PageMeta";

const getCurrentMinOfDay = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return h * 60 + m;
};

const getCurrentWeekday = () => {
  const today = new Date();
  const standardIndex = today.getDay();
  const mondayBasedIndex = (standardIndex + 6) % 7;
  return weekdayOrder[mondayBasedIndex];
};

type OperatingStatus = "OPEN" | "CLOSED";

const StatusIndicator = ({ status }: { status: OperatingStatus }) => {
  const isOpen = status === "OPEN";
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-100 border border-base-300 w-fit">
      <span
        className={`status w-2.5 h-2.5 ${
          isOpen ? "status-success" : "status-error"
        }`}
      ></span>
      <span
        className={`text-xs font-semibold tracking-wide ${
          isOpen ? "text-success" : "text-error"
        }`}
      >
        {isOpen ? "營業中" : "休息中"}
      </span>
    </div>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  active = false,
  variant = "secondary",
}: {
  icon: any;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) => {
  const baseClass = "btn btn-sm sm:btn-md gap-2 transition-all duration-300";
  const variants = {
    primary: "btn-primary shadow-lg shadow-primary/20 text-white",
    secondary:
      "bg-base-100 border border-base-200 shadow-sm hover:border-base-300 hover:bg-base-200 text-base-content",
    ghost: "btn-ghost hover:bg-base-200/50",
  };

  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]}`}>
      <Icon
        className={`w-5 h-5 ${active ? "fill-current" : ""} ${
          variant === "primary" ? "text-white" : ""
        }`}
      />
      {label && <span className="hidden sm:inline font-medium">{label}</span>}
    </button>
  );
};

// --- Refined Timeline Component ---

const MinimalRangeBlock = ({
  startMinOfDay,
  endMinOfDay,
  isToday,
}: {
  startMinOfDay: number;
  endMinOfDay: number;
  isToday: boolean;
}) => {
  const total = 1440;
  const startPct = (startMinOfDay / total) * 100;
  const lengthPct = ((endMinOfDay - startMinOfDay) / total) * 100;
  const currentMin = getCurrentMinOfDay();
  const currentPct = (currentMin / total) * 100;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Determine if current time is within this specific block
  const isNowInBlock =
    isToday && currentMin >= startMinOfDay && currentMin <= endMinOfDay;

  return (
    <div className="flex flex-col w-full group">
      {/* Time Labels */}
      <div className="flex justify-between text-xs text-base-content/40 mb-1 font-mono">
        <span>{formatTime(startMinOfDay)}</span>
        <span>{formatTime(endMinOfDay)}</span>
      </div>

      {/* Bar Container */}
      <div className="relative h-2 w-full bg-base-200 rounded-full overflow-hidden">
        {/* Active Range */}
        <div
          className={`absolute h-full rounded-full transition-colors duration-500 ${
            isToday
              ? isNowInBlock
                ? "bg-primary"
                : "bg-primary/40"
              : "bg-base-content/20 group-hover:bg-base-content/30"
          }`}
          style={{ left: `${startPct}%`, width: `${lengthPct}%` }}
        />

        {/* Current Time Indicator (Only if today) */}
        {isToday && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-error z-10 shadow-[0_0_8px_rgba(255,0,0,0.5)]"
            style={{ left: `${currentPct}%` }}
          />
        )}
      </div>
    </div>
  );
};

const ContactInfoSheet = ({ contactInfo }: { contactInfo: ContactInfo[] }) => {
  const { showToast } = useToast();

  const copyContent = async (content: string) => {
    try {
      if (!content) throw new Error();
      await navigator.clipboard.writeText(content);
      showToast({
        title: "複製成功",
        icon: <Copy className="text-success" />,
      });
    } catch {
      showToast({
        title: "複製失敗",
        replace: true,
        icon: <CircleX className="text-error" />,
      });
    }
  };

  return (
    <ul className="space-y-4">
      <div className="divider"></div>
      {contactInfo.length === 0 && (
        <li className="flex justify-center items-center space-x-2 opacity-50 text-sm">
          <UserRoundX className="w-5 h-5" />
          <p>目前沒有聯絡資訊</p>
        </li>
      )}
      {contactInfo.map((info, i) => (
        <li className="flex gap-2 items-center" key={`CONTACT_INFO_ITEM_${i}`}>
          <div className="p-2 border border-base-300 rounded-full">
            <ContactCategoryIcon category={info.category} className="w-6 h-6" />
          </div>

          <p className="truncate flex-1">{info.formatter(info.content)}</p>

          {info.category === "phone-number" ? (
            <Link
              to={info.href || buildHref("phone-number", info.content)}
              className="btn btn-circle"
            >
              <Phone className="w-5 h-5 text-primary fill-primary" />
            </Link>
          ) : (
            <Link
              to={info.href || buildHref(info.category, info.content)}
              target="_blank"
              className="btn btn-circle"
            >
              <ExternalLink className="w-5 h-5" />
            </Link>
          )}

          <button
            className="btn btn-circle"
            onClick={() => copyContent(info.content)}
          >
            <Copy className="w-5 h-5" />
          </button>
        </li>
      ))}
    </ul>
  );
};

// --- Main Components ---

export const ShopDetailContent = ({
  shop,
  isPreview = false,
}: {
  shop: Shop | null;
  isPreview?: boolean;
}) => {
  const { isMobile } = useDevice();
  const { goBack } = usePathHistory();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  // Status Logic
  const status: OperatingStatus = useMemo(() => {
    if (!shop) return "CLOSED";
    const currentWeekday = getCurrentWeekday();
    const scheduleToday = shop.workSchedules.find(
      (w) => w.weekday === currentWeekday
    );
    if (!scheduleToday) return "CLOSED";
    const currentMinOfDay = getCurrentMinOfDay();
    if (
      scheduleToday.startMinuteOfDay < currentMinOfDay &&
      scheduleToday.endMinuteOfDay > currentMinOfDay
    ) {
      return "OPEN";
    }
    return "CLOSED";
  }, [shop]);

  const copyText = async (textToCopy: string | null | undefined) => {
    try {
      if (!textToCopy) throw new Error();
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        title: "複製成功",
        icon: <Copy className="text-success" />,
      });
    } catch {
      showToast({
        title: "複製失敗",
        icon: <CircleX className="text-error" />,
      });
    }
  };

  const copyAddress = () => {
    copyText(shop?.address);
  };

  const copyLink = () => {
    const link = window.location.href;
    copyText(link);
  };

  const handleSave = () => {
    if (true) {
      showToast({
        title: "預覽模式無法收藏",
        placement: "top",
        replace: true,
      });
      return;
    }
    //TODO: Add actual api
    setIsSaved(!isSaved);
    showToast({
      title: isSaved ? "已取消收藏" : "已收藏",
      icon: (
        <Bookmark
          size={16}
          className={!isSaved ? "fill-primary text-primary" : ""}
        />
      ),
    });
  };

  const openContactInfoSheet = () => {
    setIsContactSheetOpen((prev) => !prev);
  };

  if (!shop && !isPreview)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

  const renderSchedule = () => {
    if (!shop?.workSchedules || shop.workSchedules.length === 0) return null;

    // 1. Group intervals by Weekday
    // Map<Weekday, Array<[start, end]>>
    const dayMap = new Map<Weekday, Array<[number, number]>>();

    shop.workSchedules.forEach((sch) => {
      if (!dayMap.has(sch.weekday)) {
        dayMap.set(sch.weekday, []);
      }
      dayMap.get(sch.weekday)!.push([sch.startMinuteOfDay, sch.endMinuteOfDay]);
    });

    // 2. Sort intervals for each day to ensure consistency
    dayMap.forEach((ranges) => {
      ranges.sort((a, b) => a[0] - b[0]);
    });

    // 3. Group Weekdays by identical schedule signatures
    // Signature example: "540-720,840-1020"
    const groupedSchedules = new Map<
      string,
      { days: Weekday[]; ranges: Array<[number, number]> }
    >();

    dayMap.forEach((ranges, day) => {
      const signature = ranges.map((r) => `${r[0]}-${r[1]}`).join(",");

      if (!groupedSchedules.has(signature)) {
        groupedSchedules.set(signature, { days: [], ranges });
      }
      groupedSchedules.get(signature)!.days.push(day);
    });

    const currentWeekday = getCurrentWeekday();
    // Convert Map to Array for rendering and sort by weekday order roughly (optional, but good for UI)
    const displayGroups = Array.from(groupedSchedules.values()).sort((a, b) => {
      // Simple sort by first day in the group
      const idxA = weekdayOrder.indexOf(a.days[0]);
      const idxB = weekdayOrder.indexOf(b.days[0]);
      return idxA - idxB;
    });

    return (
      <div className="space-y-4">
        <PageMeta {...routesMeta.shopDetail(shop.title)} />
        {displayGroups.map((group, idx) => {
          const isToday = group.days.includes(currentWeekday);

          return (
            <div
              key={idx}
              className={`flex flex-col sm:flex-row gap-3 sm:gap-6 p-4 rounded-2xl transition-all ${
                isToday
                  ? "bg-primary/5 border border-primary/10"
                  : "bg-base-100 border border-base-200/50 hover:border-base-300"
              }`}
            >
              {/* Left Column: Weekdays */}
              <div className="w-full sm:w-24 flex-shrink-0 flex items-center justify-between sm:justify-start">
                <span
                  className={`font-medium ${
                    isToday ? "text-primary" : "text-base-content/70"
                  }`}
                >
                  {formatWeekdays(group.days)}
                </span>
                {isToday && (
                  <span className="sm:hidden badge badge-xs badge-primary badge-soft">
                    Today
                  </span>
                )}
              </div>

              {/* Right Column: Time Blocks (Stack vertically if multiple slots) */}
              <div className="flex-1 w-full flex flex-col gap-2 justify-center">
                {group.ranges.map((range, rangeIdx) => (
                  <MinimalRangeBlock
                    key={`range-${idx}-${rangeIdx}`}
                    startMinOfDay={range[0]}
                    endMinOfDay={range[1]}
                    isToday={isToday}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <article
      className="min-h-screen bg-base-50/50"
      itemScope
      itemType="https://schema.org/Store"
    >
      {/* 1. Header / Navigation (Sticky, blurred) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 h-16 flex items-center justify-between bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-3">
          {isMobile ? (
            <>
              <button
                onClick={() => goBack()}
                className="btn btn-circle btn-sm btn-ghost hover:bg-base-content/10"
              >
                <ChevronLeft size={20} />
              </button>

              <div
                className="hidden sm:block opacity-0 animate-fade-in animation-delay-300 transition-opacity duration-300"
                style={{ opacity: status ? 1 : 0 }}
              >
                <span className="font-semibold text-sm line-clamp-1">
                  {shop?.title}
                </span>
              </div>
            </>
          ) : (
            <Logo className="h-10 w-auto" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            icon={Bookmark}
            onClick={handleSave}
            active={isSaved}
            variant="ghost"
          />
          <ActionButton icon={Share2} onClick={copyLink} variant="ghost" />
        </div>
      </nav>

      <Sidebar isOpen={false}>
        <SidebarContent disabled={true} />
      </Sidebar>

      <div className="pt-16 lg:pl-64 min-h-screen flex flex-col lg:flex-row">
        {/* 2. Left Column: Gallery (Sticky on Desktop) */}
        <div className="lg:w-5/12 xl:w-1/2 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16  no-scrollbar bg-base-100 overflow-clip">
          {/* Mobile Carousel / Desktop Grid */}
          {(shop?.images.length ?? 0) > 0 ? (
            <div className="relative w-full h-[40vh] lg:h-full group">
              <img
                src={shop?.images[activeImgIndex].thumbnailUrl}
                alt="Shop Cover"
                className="w-full h-full object-cover lg:object-center transition-transform duration-700 hover:scale-105"
                onClick={() => setIsModalOpen(true)}
                itemProp="image"
              />

              {/* Image Controls (Mobile Overlay) */}
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 lg:hidden">
                {shop?.images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeImgIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              {(shop?.images.length ?? 0) > 1 && (
                <>
                  <button
                    className={`absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/20 border-none text-white hover:bg-black/40 ${
                      isMobile ? "" : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImgIndex((p) =>
                        p === 0 ? shop!.images.length - 1 : p - 1
                      );
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className={`absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/20 border-none text-white hover:bg-black/40 ${
                      isMobile ? "" : "opacity-0 group-hover:opacity-100"
                    } transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImgIndex((p) =>
                        p === shop!.images.length - 1 ? 0 : p + 1
                      );
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* View All Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <ImageOff className="w-3.5 h-3.5" />
                查看 {shop?.images.length} 張照片
              </button>
            </div>
          ) : (
            <div className="w-full h-64 lg:h-full flex flex-col items-center justify-center bg-base-200 text-base-content/30">
              <ImageOff size={48} strokeWidth={1.5} />
              <p className="mt-2 text-sm">尚無圖片</p>
            </div>
          )}
        </div>

        {/* 3. Right Column: Content (Scrollable) */}
        <div className="flex-1 px-5 py-8 lg:px-10 lg:py-12 max-w-4xl mx-auto w-full">
          {/* Breadcrumbs / School Tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-neutral badge-soft">
              <School className="w-3.5 h-3.5" />
              {shop?.schoolAbbr || "Unknown"}
            </span>

            <span
              className="badge badge-info badge-soft cursor-pointer"
              onClick={openContactInfoSheet}
            >
              <CircleUserRound className="w-4 h-4" />
              聯絡資訊
            </span>
          </div>
          {/* Title & Status */}
          <div className="flex flex-col gap-4 mb-8">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-base-content leading-tight"
              itemProp="name"
            >
              {shop?.title ||
                (isPreview ? (
                  <span className="text-base-content/20">未命名商家</span>
                ) : (
                  <div className="skeleton w-full h-10 rounded-field" />
                ))}
            </h1>
            {shop?.subTitle && (
              <h2 className="opacity-60 -mt-4">{shop.subTitle}</h2>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <StatusIndicator status={status} />

              {/* Address Button */}
              <button
                onClick={copyAddress}
                className="group flex items-center gap-1.5 text-sm text-base-content/60 hover:text-primary transition-colors text-left"
              >
                <MapPin className="w-4 h-4" />
                <span
                  className="group-hover:underline underline-offset-4 decoration-primary/30"
                  itemProp="address"
                >
                  {shop?.address || "無地址資訊"}
                </span>
              </button>
            </div>
          </div>
          {/* Feature: Discount Card */}
          <div className="mb-10 group relative overflow-hidden rounded-box bg-base-200 border border-base-300 p-4">
            <div className="absolute -top-2 right-0 p-4 group-hover:rotate-12 rotate-12 sm:rotate-0 opacity-10 group-hover:opacity-100 group-hover:text-amber-200 transition-all transform group-hover:scale-110 duration-500">
              <BadgeDollarSign size={120} />
            </div>
            <h3 className="text-indigo-400 font-semibold tracking-wide uppercase text-xs mb-2">
              專屬優惠
            </h3>

            <div className="flex items-center gap-3">
              <TicketPercent className="text-indigo-500 w-6 h-6 flex-shrink-0" />
              <p className="text-xl sm:text-lg font-bold text-base-content/90 z-10">
                {shop?.discount || "目前沒有特別優惠"}
              </p>
            </div>
          </div>
          {/* Description */}
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              關於商家
            </h2>
            <div className="prose prose-base text-base-content/80 leading-relaxed max-w-none">
              <p itemProp="description" className="whitespace-pre-wrap">
                {shop?.description || "暫無介紹..."}
              </p>
            </div>
          </section>
          {/* Divider */}
          <hr className="border-base-200 mb-12" />
          {/* Schedule Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-base-content/50" />
                營業時間
              </h2>
              {status === "OPEN" && (
                <span className="badge badge-success badge-soft rounded-field">
                  現在營業中
                </span>
              )}
            </div>
            {renderSchedule()}
          </section>
          {/* Mobile Bottom Action Bar (Fixed) */}
          <div className="lg:hidden h-20" /> {/* Spacer */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-base-100/90 backdrop-blur-xl border-t border-base-200 z-30 lg:hidden flex gap-3 safe-area-bottom pwa:pb-[34pt]">
            <button
              onClick={() => navigate("/shops/map")}
              className="btn btn-primary flex-1 rounded-xl shadow-lg shadow-primary/20"
            >
              地圖中開啟
            </button>
            <button
              className="btn btn-square btn-ghost rounded-xl bg-base-200/50"
              onClick={handleSave}
            >
              <Bookmark
                className={isSaved ? "fill-current text-primary" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {shop?.images && (
        <ImageGalleryModal
          imageLinks={shop.images.map((i) => i.fileUrl)}
          initialIndex={activeImgIndex}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <ResponsiveSheet
        isOn={isContactSheetOpen}
        title="聯絡資訊"
        onClose={() => setIsContactSheetOpen(false)}
      >
        <ContactInfoSheet contactInfo={shop?.contactInfo ?? []} />
      </ResponsiveSheet>
    </article>
  );
};

const ShopDetail = () => {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const { showModal } = useModal();

  const a = async () => {
    const { data: resData } = await axios.get(path(`/api/shops/${id}`));
    const { success, data, error } = resData;
    if (!success) {
      showModal({
        title: "找不到商店",
        description: getErrorMessage(error.code),
      });
      return;
    }
    setShop(transformDtoToShop(data));
  };

  useEffect(() => {
    a();
  }, [id]);

  return <ShopDetailContent shop={shop} />;
};

export default ShopDetail;
