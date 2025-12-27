import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { School } from "../types/school";
import SchoolIcon from "../widgets/SchoolIcon";
import { Google, TintedInstagram } from "@icons";
import {
  AlertCircle,
  Globe,
  IdCard,
  Info,
  Menu,
  ShoppingCart,
  SquareArrowOutUpRight,
} from "lucide-react";
import ShopCard from "../widgets/Shop/ShopCard";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import { path } from "../utils/path";
import { useModal } from "../widgets/ModalContext";
import { usePathHistory } from "../contexts/PathHistoryContext";
import axios from "axios";
import { useToast } from "../widgets/Toast/ToastProvider";
import { transformDtoToShop } from "../types/shop";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";

const mockSchool: School = {
  id: "123",
  name: "港明高中",
  abbreviation: "kmsh",
  loginMethod: "credential",
  websiteUrl: "http://www.kmsh.tn.edu.tw",
  instagramAccount: "kmsa_116th",
  shops: [
    {
      id: "shop1",
      title: "商店",
      description: "屁眼",
      contactInfo: [],
      schoolId: "123",
      schoolAbbr: "kmsh",
      images: [
        {
          fileUrl: "https://images.cooperativeshops.org/kmsh.gif",
          thumbnailUrl: "https://images.cooperativeshops.org/kmsh.gif",
        },
      ],
      thumbnailLink: "https://image.cooperativeshops.org/kmsh.gif",
      isOpen: false,
      discount: null,
      address: "Fuck you <3",
      longitude: 0,
      latitude: 0,
      workSchedules: [],
    },
    {
      id: "shop1",
      title: "商店",
      description: "屁眼",
      contactInfo: [],
      schoolId: "123",
      schoolAbbr: "kmsh",
      images: [
        {
          fileUrl: "https://images.cooperativeshops.org/kmsh.gif",
          thumbnailUrl: "https://images.cooperativeshops.org/kmsh.gif",
        },
      ],
      thumbnailLink: "https://image.cooperativeshops.org/kmsh.gif",
      isOpen: false,
      discount: null,
      address: "Fuck you <3",
      longitude: 0,
      latitude: 0,
      workSchedules: [],
    },
  ],
};

const SchoolDetail = () => {
  const { abbr: schoolAbbrParam } = useParams();
  const [schoolAbbr, setSchoolAbbr] = useState(schoolAbbrParam);
  const { activeUserRef, restorePromise } = useAuth();
  const [school, setSchool] = useState<School | null>(mockSchool);
  const [showSidebar, setShowSidebar] = useState(false);

  const { showModal } = useModal();
  const { showToast } = useToast();
  const { goBack } = usePathHistory();

  const getUserSchool = async (): Promise<string | undefined> => {
    if (schoolAbbrParam === "me") {
      if (!activeUserRef.current && restorePromise) {
        const result = await restorePromise;
        if (!result.ok) {
          return;
        }
      }

      setSchoolAbbr(activeUserRef.current?.schoolAbbr);
      return activeUserRef.current?.schoolAbbr;
    }
  };

  const fetchSchool = async (schoolAbbr: string | undefined) => {
    try {
      if (!schoolAbbr) throw new Error("No fucking school abbr");
      const res = await fetch(path(`/api/schools/abbr/${schoolAbbr}`));
      const resData = await res.json();
      if (!resData.success) {
        throw new Error("Fuck");
      }
      setSchool(resData.data);
      const res2 = await axios.get(path(`/api/shops?schoolAbbr=${schoolAbbr}`));
      if (!res2.data.success) {
        showToast({
          title: "無法取得該校合作店家",
          icon: <AlertCircle className="text-error" />,
          placement: "bottom",
        });
      }
      setSchool((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          shops: (res2.data.data ?? []).map(transformDtoToShop),
        };
      });
    } catch (error: any) {
      showModal({
        title: `無法獲取學校 "${schoolAbbr}" 的資料`,
        description:
          "請聯絡南校聯合特約的 Instagram 或貴校學生會以使此問題更快地被修復 (*´▽`*)",
        buttons: [
          {
            label: "南校聯合特約 IG",
            onClick: () =>
              (location.href =
                "https://www.instagram.com/cooperativeshops_2026"),
          },
          {
            label: "返回",
            onClick: () => goBack(),
          },
        ],
      });
    }
  };

  useEffect(() => {
    const a = async () => {
      const abbr = await getUserSchool();
      fetchSchool(abbr);
    };
    a();
  }, [schoolAbbrParam]);
  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center pt-18">
      <nav className="navbar fixed z-50 bg-base-100 top-0 shadow-xs">
        <div className="navbar-start space-x-2">
          <button
            className="btn btn-square btn-ghost"
            onClick={() => setShowSidebar((prev) => !prev)}
          >
            <Menu />
          </button>

          <Logo className="h-9 w-auto hidden md:block" />
        </div>
        <div className="navbar-center space-x-2">
          <h3 className="font-semibold">我的學校</h3>
        </div>
        <div className="navbar-end space-x-2"></div>
      </nav>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      <div className="max-w-xl pt-10 w-full p-4 space-y-4 lg:ms-64">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <div className="p-5 bg-white rounded-full overflow-clip border-2 border-neutral/9">
              {schoolAbbr !== "me" ? (
                <SchoolIcon
                  abbreviation={schoolAbbr ?? "kmsh"}
                  className="w-25 h-25"
                />
              ) : (
                <div className="w-25 h-25 flex justify-center items-center">
                  <span className="loading" />
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1 p-1 bg-base-100 border-4 border-base-300 rounded-full">
              {school?.loginMethod === "google" ? (
                <Google className="w-5 h-5" />
              ) : (
                <IdCard className="w-5 h-5" />
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-[0.5em] -me-[0.5em] text-center">
            {school?.name}
          </h1>

          <span className="opacity-50">
            {school?.abbreviation} <span className="font-black">&middot;</span>{" "}
            {(school?.shops ?? []).length} 間特約
          </span>
        </div>

        <span className="font-semibold text-sm opacity-50">基本資料</span>
        <ul className="w-full bg-base-100 rounded-box p-4 space-y-2">
          <li className="flex space-x-2 items-center">
            <Globe />
            <span className="flex-1">網站</span>
            <a
              href={school?.websiteUrl ?? ""}
              target="_blank"
              className="btn btn-sm"
            >
              前往
              <SquareArrowOutUpRight size={16} strokeWidth={2.3} />
            </a>
          </li>

          <div className="divider opacity-35"></div>

          <li className="flex space-x-2 items-center">
            <TintedInstagram className="w-6 h-6" />
            <span className="flex-1">Instagram</span>
            <a
              href={
                school?.websiteUrl
                  ? `https://www.instagram.com/${school.instagramAccount}`
                  : ""
              }
              target="_blank"
              className="btn btn-sm"
            >
              @{school?.instagramAccount}
              <SquareArrowOutUpRight size={16} strokeWidth={2.3} />
            </a>
          </li>

          <div className="divider opacity-35"></div>

          <li className="flex space-x-2 items-center">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
            <span className="flex-1">簽約商家數量</span>
            {(() => {
              const count = (school?.shops ?? []).length;
              return (
                <span
                  className={
                    count < 5
                      ? "text-error"
                      : count >= 5 && count < 10
                      ? "text-warning"
                      : count > 10
                      ? "text-success"
                      : ""
                  }
                >
                  {count}
                </span>
              );
            })()}

            <Link
              to="/faq?filter=about_shops"
              className="btn btn-circle btn-xs"
            >
              <Info size={16} />
            </Link>
          </li>
        </ul>

        <span className="font-semibold text-sm opacity-50">簽約商家</span>
        <div className="bg-base-100 p-4 rounded-box space-y-4">
          {(school?.shops ?? []).length === 0 && (
            <p className="text-center opacity-50 text-sm">沒有簽約的商家</p>
          )}
          {(school?.shops ?? []).map((shop) => (
            <div>
              <ShopCard shop={shop} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SchoolDetail;
