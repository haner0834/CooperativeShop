import {
  ShoppingCart,
  RotateCcw,
  Flame,
  BookmarkIcon,
  MapPin,
  Map,
  User,
  QrCode,
  UserRoundCog,
  ScanLine,
  School,
  Ellipsis,
  BadgeQuestionMark,
  MessageCircleWarning,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "./Toast/ToastProvider";
import { Link } from "react-router-dom";

// ✅ 受控 icon map，只包含實際會用到的 icons
export const ICONS = {
  ShoppingCart,
  RotateCcw,
  Flame,
  BookmarkIcon,
  MapPin,
  Map,
  User,
  QrCode,
  UserRoundCog,
  ScanLine,
  School,
  Ellipsis,
  BadgeQuestionMark,
  MessageCircleWarning,
} as const;

// ✅ 讓 icon 屬性型別限定於 ICONS 的 key
export type IconName = keyof typeof ICONS;

export type MenuItem = {
  label: string;
  href?: string;
  icon?: IconName;
  color?: string;
  children?: MenuItem[];

  match?: (location: Location) => boolean;
};

// ✅ 現有 menu 結構不變，只是 icon 型別更嚴謹
export const menu: MenuItem[] = [
  {
    label: "合作商家",
    icon: "ShoppingCart",
    color: "text-amber-500",
    href: "/shops?type=home",
    children: [
      {
        label: "近期訪問",
        href: "/shops?type=recent",
        icon: "RotateCcw",
        match: (loc) =>
          loc.pathname === "/shops" &&
          new URLSearchParams(loc.search).get("type") === "recent",
      },
      {
        label: "熱門",
        href: "/shops?type=hot",
        icon: "Flame",
        match: (loc) =>
          loc.pathname === "/shops" &&
          new URLSearchParams(loc.search).get("type") === "hot",
      },
      {
        label: "已保存",
        href: "/shops?type=saved",
        icon: "BookmarkIcon",
        match: (loc) =>
          loc.pathname === "/shops" &&
          new URLSearchParams(loc.search).get("type") === "saved",
      },
      {
        label: "附近商家",
        href: "/shops?type=nearby",
        icon: "MapPin",
        match: (loc) =>
          loc.pathname === "/shops" &&
          new URLSearchParams(loc.search).get("type") === "nearby",
      },
      { label: "商家地圖", href: "/shops/map", icon: "Map" },
    ],
    match: (loc) =>
      (loc.pathname === "/shops" &&
        new URLSearchParams(loc.search).get("type") === "home") ||
      new URLSearchParams(loc.search).get("type") === null,
  },
  {
    label: "我的",
    icon: "User",
    color: "text-blue-500",
    children: [
      { label: "個人 QR", icon: "QrCode", href: "/home" },
      { label: "帳號中心", icon: "UserRoundCog" },
      { label: "QR 掃描", icon: "ScanLine" },
      { label: "學校", icon: "School" },
    ],
  },
  {
    label: "其他",
    icon: "Ellipsis",
    color: "text-gray-400",
    children: [
      { label: "FAQ", icon: "BadgeQuestionMark", href: "/faq" },
      { label: "問題回報", icon: "MessageCircleWarning" },
    ],
  },
];

export const Icon = ({
  name,
  color,
}: {
  name?: keyof typeof ICONS;
  color?: string;
}) => {
  if (!name) return null;

  const LucideIcon = ICONS[name] as ComponentType<SVGProps<SVGSVGElement>>;
  return <LucideIcon className={`w-5 h-5 ${color ?? ""}`} />;
};

const SidebarItem = ({
  item,
  disabled = false,
}: {
  item: MenuItem;
  disabled: boolean;
}) => {
  const { showToast } = useToast();
  const hintUserTheyreInPreviewMode = () => {
    showToast({
      title: "預覽中無法使用",
      placement: "top-left",
    });
  };
  const isActive =
    item.match?.(location) ??
    (item.href &&
      location.pathname ===
        new URL(item.href, window.location.origin).pathname);

  return (
    <>
      <li>
        {disabled ? (
          <button onClick={hintUserTheyreInPreviewMode}>
            <Icon name={item.icon} color={item.color} />
            {item.label}
          </button>
        ) : item.href ? (
          <Link to={item.href} className={isActive ? "menu-active" : ""}>
            <Icon name={item.icon} color={item.color} />
            {item.label}
          </Link>
        ) : (
          <div>
            <Icon name={item.icon} color={item.color} />
            {item.label}
          </div>
        )}
      </li>

      {item.children && (
        <div className="flex flex-row ps-4 gap-2">
          <div className="self-stretch w-[1.5px] bg-neutral/10" />
          <ul className="w-full">
            {item.children.map((child, i) => (
              <SidebarItem key={i} item={child} disabled={disabled} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export const SidebarContent = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => (
  <div className="pt-16">
    <ul className="menu bg-base-100 min-h-full w-full space-y-2">
      {menu.map((item, i) => (
        <SidebarItem key={i} item={item} disabled={disabled} />
      ))}
    </ul>

    <div className="w-full fixed bottom-0 m-2 lg:hidden">
      <ThemeToggle />
    </div>
  </div>
);
