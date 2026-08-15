import Logo from "../../widgets/Logo";
import { LogIn } from "lucide-react";
import { path } from "../../utils/path";
import { getDeviceId } from "../../utils/device";
import { useSearchParams } from "react-router-dom";

// 密碼登入已經拿掉了，admin 一律用 Google OAuth 登入。
// 這裡不打 fetch，是直接整頁導去後端的 /auth/admin/google，
// 由後端組好帶 state 的 Google 授權 URL 再轉導過去——
// OAuth authorization code flow 本來就得是整頁導轉，不能用 XHR/fetch 打。
const AdminLogin = () => {
  const [searchParams] = useSearchParams();

  const handleGoogleLogin = () => {
    const to = searchParams.get("to");

    const params = new URLSearchParams({ deviceId: getDeviceId() });
    if (to && to !== "null") {
      params.set("to", to);
    }

    window.location.href = `${path(
      "/api/auth/admin/google"
    )}?${params.toString()}`;
  };

  return (
    <div className="w-full min-h-screen bg-base-100 flex flex-col items-center justify-center gap-6">
      <Logo className="h-10 w-auto" />

      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-6 gap-2">
        <legend className="fieldset-legend">Admin Login</legend>

        <p className="text-sm text-base-content/60 mb-2 text-center">
          請使用你受邀註冊的 Google 帳號登入管理後台
        </p>

        <button onClick={handleGoogleLogin} className="btn btn-neutral gap-2">
          <LogIn size={18} />
          Continue with Google
        </button>
      </fieldset>
    </div>
  );
};

export default AdminLogin;
