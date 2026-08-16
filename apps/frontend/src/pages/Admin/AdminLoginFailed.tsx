import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleX } from "lucide-react";
import { useAdminAuth } from "../../auth/admin-auth/AdminAuthContext";
import { getDeviceId } from "../../utils/device";
import { path } from "../../utils/path";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { useModal } from "../../widgets/ModalContext";

// Google OAuth callback 在後端只做了一件事：設好 httpOnly 的 adminRefreshToken
// cookie，然後把瀏覽器導來這頁——accessToken 刻意不放在 redirect URL 上
// （避免留在瀏覽器歷史/Referrer）。所以這頁落地後要做的事，
// 就是用剛剛那顆 cookie 打一次 /restore 換 accessToken，灌進 context，
// 再導去使用者原本要去的地方。
const AdminOAuthCallbackPage = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { showModal } = useModal();
  const ran = useRef(false);

  useEffect(() => {
    // React 18 StrictMode 下 effect 會跑兩次，這裡只讓 restore 真正打一次
    if (ran.current) return;
    ran.current = true;
    if (searchParams.get("code") || searchParams.get("message")) {
      showModal({
        title: searchParams.get("code") ?? "FUCK",
        description: searchParams.get("message") ?? "FUCK",
      });
    }

    (async () => {
      try {
        await login(
          fetch(path("/api/auth/admin/restore"), {
            method: "POST",
            credentials: "include",
            headers: { "X-Device-ID": getDeviceId() },
          }).then((r) => r.json())
        );

        const to = searchParams.get("to");
        navigate(to && to !== "null" ? to : "/admin", { replace: true });
      } catch (e: any) {
        showToast({
          title: "登入失敗",
          description: getErrorMessage(e.message),
          icon: <CircleX className="text-error" />,
        });
        navigate("/admin/login", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
};

export default AdminOAuthCallbackPage;
