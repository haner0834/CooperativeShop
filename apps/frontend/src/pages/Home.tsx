import { useEffect, useState } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import { getDeviceId } from "../utils/device";
import { useAuth } from "../auth/AuthContext";
import type { LoginMethod, School } from "../types/school";
import { useAuthFetch } from "../auth/useAuthFetch";
import { IdCard, School as SchoolIcon, Menu, Google, Check } from "@icons";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import { useModal } from "../widgets/ModalContext";
import { useNavigate } from "react-router-dom";
import { path } from "../utils/path";

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

const SheetContent = ({
  handleSwitch,
}: {
  handleSwitch: (id: string) => void;
}) => {
  const { switchableAccounts, activeUser, logout } = useAuth();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const askLogout = () => {
    showModal({
      title: "確認登出目前帳號？",
      description: `您將登出目前帳號（${activeUser?.name || "Unknown"}）`,
      buttons: [
        {
          label: "取消",
        },
        {
          label: "登出",
          style: "btn-error",
          role: "error",
          onClick: handleLogout,
        },
      ],
    });
  };

  const handleLogout = async () => {
    logout();
  };

  return (
    <div className="relative md:h-screen">
      <ul className="space-y-4">
        {switchableAccounts.map((account) => {
          const loginMethod: LoginMethod = account.email
            ? "google"
            : "credential";

          return (
            <li
              key={account.name}
              onClick={() => handleSwitch(account.id)}
              className="flex items-center"
            >
              <div className="flex items-center space-x-2 w-full">
                <Avator method={loginMethod} />
                <div className="">
                  <p className="w-full font-medium">{account.name}</p>
                  <p className="text-xs opacity-50">
                    {account.email || "學號登入"}
                  </p>
                </div>
              </div>

              {activeUser?.id === account.id && (
                <div className="rounded-full p-1 bg-accent">
                  <Check className="w-4 h-4 text-base-100" strokeWidth={3} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="w-full md:absolute md:bottom-18">
        <button
          onClick={() => navigate("/choose-school")}
          className="btn w-full btn-primary mt-4"
        >
          登入新帳號
        </button>
        <button
          onClick={askLogout}
          className="btn w-full btn-error btn-soft mt-4"
        >
          登出目前帳號
        </button>
      </div>
    </div>
  );
};

const Home = () => {
  const { setNavbarButtons, setNavbarTitle } = useNavbarButtons();
  const [imgUrl, setImgUrl] = useState("");
  const { accessToken, switchAccount, activeUser } = useAuth();
  const { authedFetch } = useAuthFetch();
  const [school, setSchool] = useState<School | null>(null);
  const [isSheetOn, setIsSheetOn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isNormal, setIsNormal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const getQrCode = async () => {
    setIsLoading(true);
    const res = await fetch(path("/api/qr/generate"), {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
      },
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setImgUrl(url);

    const schoolId = activeUser?.schoolId;
    if (!schoolId) {
      throw new Error("Fuck, no student ID");
    }

    const json = await authedFetch(path(`/api/schools/${schoolId}`));

    if (!json.success) {
      setIsLoading(false);
      throw new Error("?");
    }

    setSchool(json.data);
    localStorage.setItem("isLoggedIn", "true");
    setIsLoading(false);
  };

  useEffect(() => {
    getQrCode();
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
      <div className="bg-base-100 flex flex-col items-center justify-center max-w-sm min-w-xs mx-10 p-4 px-8 rounded-3xl shadow-md">
        <button
          onClick={() => setIsNormal((prev) => !prev)}
          className={`text-2xl font-bold mb-4 ${
            isNormal ? "" : "text-success"
          }`}
        >
          {isNormal ? "會員證" : "狗牌"}
        </button>

        {isLoading ? (
          <div className="w-full flex justify-center">
            <span className="loading"></span>
          </div>
        ) : (
          <img
            src={imgUrl || "fuck"}
            alt="QR Code"
            className="w-full rounded-2xl"
          />
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
            <p className="">{school?.abbreviation}</p>
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
        <SheetContent handleSwitch={handleSwitch} />
      </ResponsiveSheet>
    </div>
  );
};

export default Home;
