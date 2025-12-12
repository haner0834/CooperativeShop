import { Link, useSearchParams } from "react-router-dom";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useEffect, useState } from "react";
import SchoolIcon from "../widgets/SchoolIcon";
import { Google } from "@icons";
import { ArrowRight, IdCard, LinkIcon } from "lucide-react";
import { usePathHistory } from "../contexts/PathHistoryContext";

const LoginHint = () => {
  const [searchParams] = useSearchParams();
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();
  const [schoolAbbr, setSchoolAbbr] = useState<string | null>(null);
  const [method, setMethod] = useState<"credential" | "google" | null>(null);
  const { goBack } = usePathHistory();

  useEffect(() => {
    setNavbarButtonsByType(["back"]);
    setNavbarTitle(undefined);

    const schoolAbbr = searchParams.get("schoolAbbr");
    setSchoolAbbr(schoolAbbr);

    const method = searchParams.get("method");
    setMethod(method as any);
  }, []);

  return (
    <div className="pt-18 min-h-screen flex flex-col items-center justify-center space-y-8 p-8">
      <div className="flex justify-center items-center space-x-8">
        {schoolAbbr && (
          <div className="p-4 bg-white rounded-full overflow-clip shadow">
            <SchoolIcon abbreviation={schoolAbbr} className="w-18 h-18" />
          </div>
        )}

        <LinkIcon className="rotate-45 w-10 h-auto" strokeWidth={3} />

        <div className="p-4 bg-white rounded-full overflow-clip shadow">
          {method === "google" ? (
            <Google className="w-18 h-18" />
          ) : (
            <IdCard className="w-18 h-18 text-black" />
          )}
        </div>
      </div>

      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold">
          {method === "google"
            ? "使用學校的 Google 帳號登入"
            : "使用學號、密碼登入"}
        </h1>
        <p className="opacity-70">
          {method === "google"
            ? "南校特約將使用您的學校 Google 帳號註冊、登入帳號。請務必使用學校配發給您的 Google 帳號。請勿使用您的個人 Gmail 帳號。"
            : "請準備您的學號。這是您在校內系統中使用的登入資訊。密碼、名稱皆可自訂。"}
        </p>
      </div>

      <div className="flex w-full max-w-lg space-x-4">
        <button className="btn flex-1" onClick={() => goBack()}>
          返回
        </button>
        <Link
          to={`/login/${method}?school=${schoolAbbr}`}
          className="btn btn-primary flex-1"
        >
          繼續 <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default LoginHint;
