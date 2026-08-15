import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, CircleX, Mail, LogIn } from "lucide-react";
import { getDeviceId } from "../../utils/device";
import { path } from "../../utils/path";
import { getErrorMessage } from "../../utils/errors";

interface InviteInfo {
  email: string;
  level: "ORGANIZATION" | "SCHOOL";
  schoolId: string | null;
}

const levelLabel = (level: "ORGANIZATION" | "SCHOOL") =>
  level === "ORGANIZATION" ? "組織管理員" : "學校管理員";

// 這頁只負責「顯示邀請資訊 + 導去 Google 登入」，不再收 name/password。
// 帳號是否真的會被建立，取決於 Google 登入拿到的 email 是否跟下面顯示的
// invite.email 完全相符——這個檢查在後端 callback 做，不是這頁的責任，
// 所以這裡不需要（也不能）自己驗證什麼。
const AdminInviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleGoogleAccept = () => {
    if (!token) return;

    const params = new URLSearchParams({
      deviceId: getDeviceId(),
      inviteToken: token,
    });

    window.location.href = `${path(
      "/api/auth/admin/google"
    )}?${params.toString()}`;
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

              <p className="text-xs text-base-content/50 text-center">
                請用上面這個 email 對應的 Google 帳號登入以完成註冊，
                用其他帳號登入會失敗、也不會建立帳號。
              </p>

              <button
                onClick={handleGoogleAccept}
                className="btn btn-primary w-full mt-2 gap-2"
              >
                <LogIn size={18} />以 Google 帳號繼續
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInviteAcceptPage;
