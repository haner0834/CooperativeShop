import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type { LoginMethod } from "../types/school";
import { Google } from "@icons";
import { IdCard, Menu, ScanLine, User } from "lucide-react";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import PageMeta from "../widgets/PageMeta";
import { SwictableAccountsSheet } from "../widgets/SwitchableAccountSheet";
import { SidebarContent } from "../widgets/SidebarContent";
import Sidebar from "../widgets/Sidebar";
import Logo from "../widgets/Logo";
import PureLogo from "@shared/app-icons/logo.jpg";

const MenuToggle = ({ onClick }: { onClick: () => void }) => {
  return (
    <div onClick={onClick} className="btn btn-circle btn-ghost">
      <User className="w-6 h-6 text-neutral" />
    </div>
  );
};

export const Avator = ({ method }: { method: LoginMethod }) => {
  switch (method) {
    case "google":
      return (
        <Google
          alt="Avator"
          className="h-12 w-12 rounded-full p-1.5 border border-base-300"
        />
      );
    case "credential":
      return (
        <div className="h-12 w-12 rounded-full border border-base-300 flex items-center justify-center">
          <IdCard className="" />
        </div>
      );
  }
};

const Home = () => {
  const { switchAccount, activeUser } = useAuth();
  const [isSheetOn, setIsSheetOn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSwitch = async (id: string) => {
    if (activeUser?.id !== id) {
      await switchAccount(id);
    } else {
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-300 px-4">
      <PageMeta />
      <nav className="navbar bg-base-100 fixed top-0 z-50 shadow-xs">
        <div className="navbar-start space-x-4">
          <button
            className="btn btn-ghost btn-square"
            onClick={() => setShowSidebar((prev) => !prev)}
          >
            <Menu />
          </button>
          <Logo className="h-9 w-auto hidden lg:block" />
        </div>
        <div className="navbar-center">
          <Logo className="h-9 w-auto lg:hidden" />
        </div>
        <div className="navbar-end">
          <MenuToggle
            onClick={() => {
              setIsSheetOn(true);
            }}
          />
        </div>
      </nav>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      <ResponsiveSheet
        isOn={isSheetOn}
        title="帳號"
        onClose={() => {
          setIsSheetOn(false);
        }}
      >
        <SwictableAccountsSheet handleSwitch={handleSwitch} />
      </ResponsiveSheet>

      {activeUser && (
        <div className="flex flex-col justify-between w-full max-w-sm aspect-[1.58/1] p-6 rounded-box border border-base-300 bg-base-100 shadow-lg text-base-content overflow-hidden">
          <div className="flex justify-between items-start">
            <img
              src={PureLogo}
              alt="Logo"
              className="w-16 h-16 rounded-2xl shadow-md"
            />
            <ScanLine className="w-8 h-8 opacity-50" />
          </div>

          <div>
            <div className="font-mono text-sm opacity-50 mb-1">
              {new Date().getFullYear()} COOPERATIVE SHOPS
            </div>
            <div className="text-2xl font-bold tracking-widest uppercase">
              {activeUser.name}
            </div>
          </div>

          <div className="flex justify-between items-end font-mono text-xs opacity-70">
            <span className="uppercase">{activeUser.schoolAbbr}</span>
            <span>VALID THRU 06/26</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
