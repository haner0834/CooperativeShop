import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import { getDeviceId } from "../utils/device";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import type { School } from "../types/school";
import { getErrorMessage } from "../utils/errors";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { path } from "../utils/path";

const GooglePlaceholder = () => {
  const [searchParams] = useSearchParams();
  const [seconds, setSeconds] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { showModal } = useModal();
  const navigate = useNavigate();

  const loginWithGoogle = (schoolId: string) => {
    const deviceId = getDeviceId();
    // Let browser redirect automatically
    location.href = path(
      `/api/auth/google?schoolId=${schoolId}&deviceId=${deviceId}`
    );
  };

  useEffect(() => {
    const id = searchParams.get("school");
    if (!id) {
      showModal({
        title: "Missing School ID",
        description:
          "Whatever you did, back to schools listing page and choose it again. If it doesn't work again, please press the 'Report' button below.",
        buttons: [
          {
            label: "Report",
            onClick: () =>
              (location.href =
                "https://www.instagram.com/cooperativeshops_2026/"),
          },
          {
            label: "Back",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/choose-school"),
          },
        ],
      });
      return;
    }

    // 取得 User Agent 字串，並轉為小寫以便比對
    var ua = navigator.userAgent.toLowerCase();

    // 判斷是否為已知的 In-App Browser
    // FBAV/FBiOS 是 Facebook 的特徵, line 是 LINE 的特徵
    var isUnsupportedBrowser =
      /fbsv|fbia|fban|fbav|fbbv|fbid|fbios|line|micromessenger/.test(ua);

    if (isUnsupportedBrowser) {
      showModal({
        title: "需要在外部瀏覽器開啟",
        description:
          "請點選右上角「⋯」，選擇「在瀏覽器中開啟」（建議使用 Safari 或 Chrome）。",
        buttons: [
          {
            label: "返回",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/choose-school"),
          },
        ],
      });
      return;
    }

    setSchoolId(id);
    loginWithGoogle(id);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col justify-center items-center space-y-2">
      <span className="loading"></span>
      <p className="text-sm font-medium opacity-60">Redirecting...</p>

      {seconds > 3 && (
        <p>
          If auto redirect is not working, tap{" "}
          <button className="link" onClick={() => loginWithGoogle(schoolId!)}>
            here
          </button>
        </p>
      )}
    </div>
  );
};

const CredentialLogin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);
  const { setAccessToken } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const { showModal } = useModal();
  const navigate = useNavigate();

  const changeMode = () =>
    setMode((prev) => (prev === "login" ? "register" : "login"));

  useEffect(() => {
    const schoolId = searchParams.get("school");
    if (!schoolId || !schools) return;
    const a = async () => {
      const res = await fetch(path("/api/schools/all?provider=credential"));
      const { success, data, error } = await res.json();

      if (success) {
        setSchools(data);
        setSelectedSchool(schoolId);
      } else {
        showModal({
          title: "發生錯誤",
          description: getErrorMessage(error.code),
          showDismissButton: true,
        });
        console.error(error);
      }
    };
    a();
  }, [searchParams]);

  const select = (id: string) => {
    setSelectedSchool(id);
    searchParams.set("school", id);
    setSearchParams(searchParams, { replace: true });
  };

  const handleSubmit = async () => {
    if (mode === "login" || mode === "register") {
      const body = JSON.stringify({
        schoolId: selectedSchool,
        studentId: id,
        name: mode === "login" ? undefined : name,
        password,
      });
      const res = await fetch(path(`/api/auth/${mode}`), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": getDeviceId(),
        },
        body,
      });
      const { success, data, error } = await res.json();
      console.log(success, data, error);
      if (!success) {
        console.error(error);
        showModal({
          title: "登入錯誤",
          description: getErrorMessage(error.code),
          showDismissButton: true,
        });
        return;
      }
      const { accessToken } = data;
      setAccessToken(accessToken);
      localStorage.setItem("isLoggedIn", "true");
      await new Promise((f) => setTimeout(f, 1000));

      navigate("/", { replace: true });
    } else {
      showModal({
        title: "WTF is going on bruh",
        showDismissButton: true,
      });
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">
          {mode === "login" ? "登入" : "註冊"}
        </legend>

        <label className="label">學校</label>
        <select
          className="select select-bordered w-full"
          value={selectedSchool}
          onChange={(e) => select(e.target.value)}
        >
          <option value="" disabled>
            選擇學校
          </option>
          {schools.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <label className="label">學號</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="input"
          placeholder="學號"
        />

        <label className="label">密碼</label>
        <label className={`input ${mode === "register" ? "validator" : ""}`}>
          <input
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "register" ? 8 : 0}
            className="grow"
            placeholder="密碼"
          />

          <button
            className=""
            onClick={() => setIsPasswordVisible((prev) => !prev)}
          >
            {isPasswordVisible ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </label>
        <p className="validator-hint hidden">不得小於8字</p>

        {mode === "register" && (
          <>
            <label className="label">名稱</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={1}
              maxLength={20}
              placeholder="煞氣a倫哥"
            />
          </>
        )}

        <button onClick={handleSubmit} className="btn btn-neutral mt-4">
          {mode === "login" ? "登入" : "註冊"}
        </button>

        <button onClick={changeMode} className="btn btn-sm btn-ghost mt-2">
          前往{mode === "register" ? "登入" : "註冊"}
        </button>
      </fieldset>

      <div className="flex justify-end space-x-2 text-xs opacity-60 w-xs mt-2">
        {/* <a className="btn btn-xs btn-ghost">服務條款</a> */}
        <a href="/privacy-policy.html" className="btn btn-xs btn-ghost">
          隱私協議
        </a>
      </div>
    </div>
  );
};

const Login = () => {
  const { method } = useParams();
  const [searchParams] = useSearchParams();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { setNavbarTitle, setNavbarButtonsByType } = useNavbarButtons();

  useEffect(() => {
    const a = async () => {
      const id = searchParams.get("school");
      if (!id) {
        showModal({
          title: "Missing school abbreviation",
          description: "Fuck u <3",
          buttons: [
            {
              label: "Back",
              role: "primary",
              style: "btn-primary",
              onClick: () => navigate(-1),
            },
          ],
        });
        return;
      }

      if (method === "google") {
      } else if (method === "credential") {
      } else {
        showModal({
          title: "FUCK U",
        });
      }
    };

    setNavbarTitle(undefined);
    setNavbarButtonsByType(["logo", "themeToggle"]);

    a();
  }, []);

  return (
    <div className="">
      {method === "google" ? (
        <GooglePlaceholder />
      ) : method === "credential" ? (
        <CredentialLogin />
      ) : (
        <div className="h-screen flex flex-col justify-center items-center">
          <p>Do u think it's funny?</p>
          <p>
            ok it is, but bro I'm just a student pls dont do that shit on my
            product
          </p>
          <p>if u still want to, u can join the developement on github</p>
        </div>
      )}
    </div>
  );
};

export default Login;
