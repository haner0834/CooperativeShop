import { useEffect, useState } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { School } from "../types/school";
import { useNavigate } from "react-router-dom";
import {
  Google,
  School as SchoolIcon,
  IdCard,
  CircleQuestionMark,
} from "@icons";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import { path } from "../utils/path";

const SchoolCard = ({ school }: { school: School }) => {
  const navigate = useNavigate();
  const toPath = () =>
    navigate(`/login/${school.loginMethod}?school=${school.id}`);
  return (
    <div className="w-full indicator">
      <span className="indicator-item badge badge-soft badge-info me-2 p-1 h-7.5">
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
        className="bg-base-100 w-full h-20 rounded-xl flex justify-center items-center px-4 gap-2"
      >
        <SchoolIcon
          className={school.abbreviation === "kmsh" ? "text-primary" : ""}
        />
        <p className="font-semibold">{school.name}</p>
      </div>
    </div>
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
        });
      }

      setSchools(
        json.data.map((school: any) => ({
          id: school.id,
          abbreviation: school.abbreviation,
          loginMethod: school.studentIdFormat ? "credential" : "google",
          name: school.name,
        }))
      );
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
    <div className="min-h-screen bg-base-300 pt-22 flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full">
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

        <ul
          className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${
            search ? "" : "pt-4"
          }`}
        >
          {(search ? filteredSchools : schools).map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChooseSchool;
