import * as Icons from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import ThemeToggle from "./ThemeToggle";

export type MenuItem = {
  label: string;
  href?: string;
  icon?: keyof typeof Icons;
  color?: string;
  children?: MenuItem[];
};

const menu: MenuItem[] = [
  {
    label: "合作商家",
    icon: "ShoppingCart",
    color: "text-amber-500",
    children: [
      { label: "近期訪問", icon: "RotateCcw" },
      { label: "熱門", icon: "Flame" },
      { label: "已保存", icon: "BookmarkIcon" },
      { label: "附近商家", icon: "MapPin" },
      { label: "商家地圖", icon: "Map" },
    ],
  },
  {
    label: "我的",
    icon: "User",
    color: "text-blue-500",
    children: [
      { label: "個人 QR", icon: "QrCode" },
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
      { label: "FAQ", icon: "BadgeQuestionMark" },
      { label: "問題回報", icon: "MessageCircleWarning" },
    ],
  },
];

const Icon = ({
  name,
  color,
}: {
  name?: keyof typeof Icons;
  color?: string;
}) => {
  if (!name) return null;
  // lucide-react exports a mix of components and helpers; assert this entry is a component
  const LucideIcon = Icons[name] as ComponentType<SVGProps<SVGSVGElement>>;
  return <LucideIcon className={`w-5 h-5 ${color ?? ""}`} />;
};

const SidebarItem = ({ item }: { item: MenuItem }) => {
  return (
    <>
      <li>
        <a href={item.href}>
          <Icon name={item.icon} color={item.color} />
          {item.label}
        </a>
      </li>

      {item.children && (
        <div className="flex flex-row ps-4 gap-2">
          <div className="self-stretch w-[1.5px] bg-neutral/10" />
          <ul className="w-full">
            {item.children.map((child, i) => (
              <SidebarItem key={i} item={child} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export const SidebarContent = () => (
  <div className="pt-18">
    <ul className="menu bg-base-100 min-h-full w-full space-y-2">
      {menu.map((item, i) => (
        <SidebarItem key={i} item={item} />
      ))}
    </ul>

    <div className="w-full fixed bottom-0 m-2 lg:hidden">
      <ThemeToggle />
    </div>
  </div>
);
