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
    label: "Shops",
    icon: "ShoppingCart",
    color: "text-amber-500",
    children: [
      { label: "Recent Visited", icon: "RotateCcw" },
      { label: "Popular", icon: "Flame" },
      { label: "Saved", icon: "BookmarkIcon" },
      { label: "Nearby", icon: "MapPin" },
      { label: "Map", icon: "Map" },
    ],
  },
  {
    label: "My",
    icon: "User",
    color: "text-blue-500",
    children: [
      { label: "Personal QR", icon: "QrCode" },
      { label: "Account Center", icon: "Settings" },
      { label: "Scanner", icon: "ScanLine" },
      { label: "School", icon: "School" },
    ],
  },
  {
    label: "Others",
    icon: "Ellipsis",
    color: "text-gray-400",
    children: [
      { label: "FAQ", icon: "BadgeQuestionMark" },
      { label: "Bug Reports", icon: "MessageCircleWarning" },
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
