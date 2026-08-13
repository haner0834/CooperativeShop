import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, CircleX, Mail } from "lucide-react";
import { useAdminAuth } from "../../auth/admin-auth/AdminAuthContext";
import { getDeviceId } from "../../utils/device";
import { path } from "../../utils/path";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../widgets/Toast/ToastProvider";

interface InviteInfo {
  email: string;
  level: "ORGANIZATION" | "SCHOOL";
  schoolId: string | null;
}

const levelLabel = (level: "ORGANIZATION" | "SCHOOL") =>
  level === "ORGANIZATION" ? "組織管理員" : "學校管理員";

// 公開頁面，不能用 useAdminAuthFetch —— 那個 hook 一開始就會去等
// restorePromise，沒登入狀態下 restore 一定失敗，會把這個請求整個擋掉。
// 這裡直接用原生 fetch，成功後用 useAdminAuth().login() 把 session 灌進 context。
const AdminInviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const { showToast } = useToast();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(path(`/api/auth/admin/invites/${token}`));
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.code);
        setInvite(json.data);
      } catch (e: any) {
        setLoadError(getErrorMessage(e.message));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      showToast({
        title: "密碼至少需要 8 個字元",
        icon: <CircleX className="text-error" />,
      });
      return;
    }
    if (password !== confirmPassword) {
      showToast({
        title: "兩次輸入的密碼不一致",
        icon: <CircleX className="text-error" />,
      });
      return;
    }

    setSubmitting(true);
    try {
      await login(
        fetch(path(`/api/auth/admin/invites/${token}/accept`), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Device-ID": getDeviceId(),
          },
          body: JSON.stringify({ name, password }),
        }).then((r) => r.json())
      );

      showToast({
        title: "帳號建立成功",
        icon: <ShieldCheck className="text-success" />,
      });
      navigate("/admin");
    } catch (e: any) {
      showToast({
        title: "建立帳號失敗",
        description: getErrorMessage(e.message),
        icon: <CircleX className="text-error" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm">
        <div className="card-body p-6 gap-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner" />
            </div>
          ) : loadError || !invite ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CircleX size={32} className="text-error" />
              <h2 className="font-semibold text-lg">邀請連結無效</h2>
              <p className="text-sm text-base-content/60">
                {loadError ?? "這個連結已失效或已被使用"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck size={32} />
                <h2 className="font-semibold text-lg">加入成為管理員</h2>
                <span className="badge badge-info badge-soft">
                  {levelLabel(invite.level)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-base-content/70 border border-base-300 rounded-field p-3">
                <Mail size={16} />
                {invite.email}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="input w-full">
                  <input
                    type="text"
                    required
                    placeholder="顯示名稱"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="input w-full">
                  <input
                    type="password"
                    required
                    placeholder="設定密碼（至少 8 個字元）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="input w-full">
                  <input
                    type="password"
                    required
                    placeholder="確認密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "建立帳號並登入"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInviteAcceptPage;
