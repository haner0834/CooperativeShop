import { useEffect, useState } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { School } from "../types/school";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Google } from "@icons";
import { IdCard, CircleQuestionMark } from "lucide-react";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import { path } from "../utils/path";
import { useAuth, type SwitchableAccount } from "../auth/AuthContext";
import SchoolIcon from "../widgets/SchoolIcon";
import PageMeta, { routesMeta } from "../widgets/PageMeta";

const SchoolCard = ({
  school,
}: {
  school: School;
  switchableAccounts: SwitchableAccount[];
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toPath = () => {
    const to = searchParams.get("to");
    navigate(`/login/${school.loginMethod}?school=${school.id}&to=${to}`);
  };
  return (
    <li className="w-full indicator">
      <span className="indicator-item badge badge-soft badge-info me-5 mt-5 p-1 h-7.5">
        <div
          className="tooltip tooltip-left"
          data-tip={
            school.loginMethod === "google"
              ? `使用 Google 登入`
              : "使用學號、密碼登入"
          }
        >
          {school.loginMethod === "google" ? (
            <Google className="w-5 h-5" />
          ) : (
            <IdCard className="w-5 h-5" />
          )}
        </div>
      </span>
      <div
        onClick={toPath}
        className="w-full flex flex-col items-center justify-center bg-base-100 py-4 rounded-box gap-2 border border-base-300"
      >
        <div className="p-3 bg-white rounded-full overflow-clip shadow">
          <SchoolIcon
            abbreviation={school.abbreviation}
            className="w-14 h-14"
          />
        </div>
        <p className="opacity-80">{school.name}</p>
      </div>
    </li>
  );
};

const QuestionButton = () => {
  const { showModal } = useModal();

  const showInfo = () => {
    showModal({
      title: "登入 / 註冊",
      showDismissButton: true,
      description: "請使用學校統一提供的 Google 帳號或學號登入系統。",
    });
  };

  return (
    <button onClick={showInfo} className="btn btn-ghost btn-circle">
      <CircleQuestionMark />
    </button>
  );
};

const ChooseSchool = () => {
  const { setNavbarButtons, setNavbarTitle } = useNavbarButtons();
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const { showModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const { switchableAccounts } = useAuth();

  const handleSearch = (newValue: string) => {
    setSearch(newValue);
    if (newValue) {
      setFilteredSchools(
        schools.filter(
          (s) => s.name.includes(newValue) || s.abbreviation.includes(newValue)
        )
      );
    }
  };

  useEffect(() => {
    const a = async () => {
      setIsLoading(true);
      const res = await fetch(path("/api/schools/all"), {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (!json.success) {
        console.error(json);
        showModal({
          title: "Unexpected error occured.",
          description: getErrorMessage(json.error.code),
          showDismissButton: true,
        });
      }

      setIsLoading(false);
      setSchools(json.data);
    };

    const baseButtons: NavbarButton[] = (
      ["logo", "themeToggle"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const menuToggleButton: NavbarButton = {
      placement: "end",
      order: 100,
      id: "navbar_menu_toggle",
      content: <QuestionButton />,
    };

    setNavbarButtons([...baseButtons, menuToggleButton]);
    setNavbarTitle(undefined);

    a();
  }, []);

  return (
    <>
      <PageMeta {...routesMeta.chooseSchool} />

      <div className="min-h-screen bg-base-200 pt-22 flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
          <label className="input w-full">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              type="search"
              className="grow"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜尋學校"
            />
          </label>
          {search && (
            <p className="text-xs opacity-50 pb-4 pt-2">
              {filteredSchools.length} 項結果
            </p>
          )}
          {!isLoading ? (
            <ul
              className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${
                search ? "" : "pt-4"
              }`}
            >
              {(search ? filteredSchools : schools).map((school) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  switchableAccounts={switchableAccounts}
                />
              ))}
            </ul>
          ) : (
            // I know this is ugly solution but it's fucking 25/08/31, 8:48 P.M. BROOOO
            <div className="w-full flex-1 items-center justify-center flex">
              <span className="loading"></span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChooseSchool;
