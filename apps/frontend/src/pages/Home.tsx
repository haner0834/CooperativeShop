import { useEffect, useState } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import { useAuth } from "../auth/AuthContext";
import type { LoginMethod } from "../types/school";
import { useAuthFetch } from "../auth/useAuthFetch";
import { Google } from "@icons";
import { IdCard, School as SchoolIcon, Menu } from "lucide-react";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import { path } from "../utils/path";
import QRDisplay from "../widgets/QRDisplay";
import PageMeta from "../widgets/PageMeta";
import { SwictableAccountsSheet } from "../widgets/SwitchableAccountSheet";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import { useNavigate } from "react-router-dom";

const MenuToggle = ({ onClick }: { onClick: () => void }) => {
  return (
    <div onClick={onClick} className="btn btn-square btn-ghost">
      <Menu className="w-6 h-6 text-neutral" />
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
  const { setNavbarButtons, setNavbarTitle } = useNavbarButtons();
  const { switchAccount, activeUser } = useAuth();
  const { authedFetch } = useAuthFetch();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const [isSheetOn, setIsSheetOn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isNormal, setIsNormal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const getQrCode = async () => {
    const { success, data, error } = await authedFetch(
      path("/api/qr/generate-data")
    );
    if (!success) {
      setIsLoading(false);
      showModal({
        title: "無法取得 QR code",
        description: getErrorMessage(error.code),
        buttons: [
          {
            label: "返回登入",
            onClick: () => navigate("/choose-school"),
          },
        ],
      });
    }

    setQrData(data);
  };

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(true);
      getQrCode();

      localStorage.setItem("isLoggedIn", "true");
      setIsLoading(false);
    }, 0);
  }, []);

  const toggleNameVisibility = () => {
    const prev = localStorage.getItem("isAnonymous");
    localStorage.setItem("isAnonymous", prev === "true" ? "false" : "true");
    setIsAnonymous((prev) => !prev);
  };

  const handleSwitch = async (id: string) => {
    if (activeUser?.id !== id) {
      await switchAccount(id);
      await getQrCode();
    } else {
      console.log("Fuck");
    }
  };

  useEffect(() => {
    const baseButtons: NavbarButton[] = (
      ["logo", "themeToggle"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const menuToggleButton: NavbarButton = {
      placement: "end",
      order: 100,
      id: "navbar_menu_toggle",
      content: (
        <MenuToggle
          onClick={() => {
            console.log("hello");
            setIsSheetOn(true);
          }}
        />
      ),
    };

    setNavbarButtons([...baseButtons, menuToggleButton]);
    setNavbarTitle(undefined);

    setIsAnonymous(localStorage.getItem("isAnonymous") === "true");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-300">
      <PageMeta />

      <div className="bg-base-100 flex flex-col items-center justify-center max-w-sm min-w-xs mx-10 p-4 px-8 rounded-box shadow-md">
        <button
          onClick={() => setIsNormal((prev) => !prev)}
          className={`text-lg font-bold mb-2 ${isNormal ? "" : "text-success"}`}
        >
          {isNormal ? "會員證" : "狗牌"}
        </button>

        {isLoading || !qrData ? (
          <div className="w-full flex justify-center">
            <span className="loading"></span>
          </div>
        ) : (
          <QRDisplay data={qrData} className="rounded-field overflow-hidden" />
        )}

        <div className="divider" />

        <div className="font-mono w-full space-y-4 pb-2">
          <button
            onClick={toggleNameVisibility}
            className="w-full flex justify-between"
          >
            <div className="flex space-x-2">
              <IdCard />
              <p>名稱</p>
            </div>
            <p className="transition-transform">
              {isAnonymous ? "匿名" : activeUser?.name}
            </p>
          </button>

          <div className="w-full flex justify-between">
            <div className="flex space-x-2">
              <SchoolIcon />
              <p>學校</p>
            </div>
            <p className="" translate="no">
              {activeUser?.schoolAbbr}
            </p>
          </div>
        </div>
      </div>

      <ResponsiveSheet
        isOn={isSheetOn}
        title="帳號"
        onClose={() => {
          setIsSheetOn(false);
        }}
      >
        <SwictableAccountsSheet handleSwitch={handleSwitch} />
      </ResponsiveSheet>
    </div>
  );
};

export default Home;
