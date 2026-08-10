import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  Mail,
  Copy,
  CircleX,
  Clock,
  Link2,
  Trash2,
  House,
  User,
} from "lucide-react";
import { useAdminAuth } from "../../auth/admin-auth/AdminAuthContext";
import { useAdminAuthFetch } from "../../auth/admin-auth/useAdminAuthFetch";
import { getErrorMessage } from "../../utils/errors";
import { path } from "../../utils/path";
import { useModal } from "../../widgets/ModalContext";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { Link } from "react-router-dom";

// ---- 型別對應後端 AdminListItem / PendingInvite ----

interface AdminListItem {
  accountId: string;
  adminId: string;
  name: string;
  email: string;
  level: "ORGANIZATION" | "SCHOOL";
  schoolId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  level: "ORGANIZATION" | "SCHOOL";
  schoolId: string | null;
  expiresAt: string;
  createAt: string;
  invitedByName: string;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "從未登入";
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const levelLabel = (level: "ORGANIZATION" | "SCHOOL") =>
  level === "ORGANIZATION" ? "組織管理員" : "學校管理員";

const buildInviteLink = (token: string) =>
  `${window.location.origin}/admin/invite/${token}`;

// -------------------- 建立邀請 Modal --------------------

const CreateInviteModal = ({
  onCreated,
}: {
  onCreated: (invite: PendingInvite, link: string) => void;
}) => {
  const { showToast } = useToast();
  const { adminAuthedFetch } = useAdminAuthFetch();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    const modal = document.getElementById(
      "create_invite_modal"
    ) as HTMLDialogElement | null;
    modal?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await adminAuthedFetch(path("/api/auth/admin/invites"), {
        method: "POST",
        body: JSON.stringify({ email, level: "ORGANIZATION" }),
      });
      if (!res.success) throw new Error(res.error?.code);

      const { token, ...invite } = res.data;
      onCreated(
        {
          id: token, // 邀請剛建立時後端還沒回傳 id，先用 token 佔位，重新整理列表後會被真的資料覆蓋
          email: invite.email,
          level: invite.level,
          schoolId: invite.schoolId,
          expiresAt: invite.expiresAt,
          createAt: new Date().toISOString(),
          invitedByName: "你",
        },
        buildInviteLink(token)
      );
      setEmail("");
      closeModal();
    } catch (e: any) {
      showToast({
        title: "建立邀請失敗",
        description: getErrorMessage(e.message),
        icon: <CircleX className="text-error" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog id="create_invite_modal" className="modal">
      <div className="modal-box flex flex-col gap-4 p-4">
        <h3 className="text-center font-semibold">邀請新的組織管理員</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="input w-full">
            <Mail size={16} className="opacity-50" />
            <input
              type="email"
              required
              placeholder="對方的 email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <p className="text-xs text-base-content/60">
            邀請連結預設 7
            天內有效，對方點開連結、設定名稱與密碼後即可成為組織管理員。
          </p>

          <div className="flex gap-2">
            <button type="button" className="btn flex-1" onClick={closeModal}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "產生邀請連結"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

// -------------------- 邀請連結建立成功 Modal --------------------

const InviteLinkResultModal = ({ link }: { link: string }) => {
  const { showToast } = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast({
        title: "已複製連結",
        icon: <Copy className="text-success" />,
      });
    } catch {
      showToast({
        title: "複製失敗",
        icon: <CircleX className="text-error" />,
      });
    }
  };

  return (
    <dialog id="invite_link_modal" className="modal">
      <div className="modal-box flex flex-col gap-4 p-4">
        <h3 className="text-center font-semibold flex items-center justify-center gap-2">
          <Link2 size={20} />
          邀請連結已建立
        </h3>

        <div className="border border-base-300 rounded-field p-3 break-all text-sm font-mono bg-base-200">
          {link}
        </div>

        <p className="text-xs text-base-content/60 text-center">
          這個連結只會顯示這一次，記得先複製再關閉視窗。
        </p>

        <div className="flex gap-2">
          <button className="btn flex-1" onClick={copyLink}>
            <Copy size={16} />
            複製連結
          </button>
          <form method="dialog" className="flex-1">
            <button className="btn btn-primary w-full">完成</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

// -------------------- 主頁面 --------------------

const AdminMembersConsole = () => {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [pendingInviteLink, setPendingInviteLink] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();
  const { showModal } = useModal();
  const { activeAdmin } = useAdminAuth();
  const { adminAuthedFetch } = useAdminAuthFetch();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        adminAuthedFetch(path("/api/auth/admin/members")),
        adminAuthedFetch(path("/api/auth/admin/invites")),
      ]);
      if (membersRes.success) setAdmins(membersRes.data);
      if (invitesRes.success) setInvites(invitesRes.data);
    } catch (e: any) {
      showToast({
        title: "載入失敗",
        description: getErrorMessage(e.message),
        icon: <CircleX className="text-error" />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreateInviteModal = () => {
    const modal = document.getElementById(
      "create_invite_modal"
    ) as HTMLDialogElement | null;
    modal?.showModal();
  };

  const handleInviteCreated = (invite: PendingInvite, link: string) => {
    setInvites((prev) => [invite, ...prev]);
    setPendingInviteLink(link);
    const modal = document.getElementById(
      "invite_link_modal"
    ) as HTMLDialogElement | null;
    modal?.showModal();
    showToast({
      title: "邀請已建立",
      icon: <ShieldCheck className="text-success" />,
    });
  };

  const revokeInvite = async (invite: PendingInvite) => {
    try {
      const res = await adminAuthedFetch(
        path(`/api/auth/admin/invites/${invite.id}/revoke`),
        { method: "POST" }
      );
      if (!res.success) throw new Error(res.error?.code);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      showToast({
        title: "邀請已撤銷",
        icon: <ShieldCheck className="text-success" />,
      });
    } catch (e: any) {
      showToast({
        title: "撤銷失敗",
        description: getErrorMessage(e.message),
        icon: <CircleX className="text-error" />,
      });
    }
  };

  const confirmRevokeInvite = (invite: PendingInvite) => {
    showModal({
      title: `撤銷對 ${invite.email} 的邀請？`,
      description: "撤銷後該邀請連結會立刻失效，對方無法再用它建立帳號",
      showDismissButton: true,
      buttons: [
        {
          label: "撤銷邀請",
          role: "error",
          style: "btn-error",
          onClick: () => revokeInvite(invite),
        },
      ],
    });
  };

  const setAdminActive = async (admin: AdminListItem, active: boolean) => {
    try {
      const res = await adminAuthedFetch(
        path(
          `/api/auth/admin/members/${admin.accountId}/${
            active ? "reactivate" : "deactivate"
          }`
        ),
        { method: "POST" }
      );
      if (!res.success) throw new Error(res.error?.code);
      setAdmins((prev) =>
        prev.map((a) =>
          a.accountId === admin.accountId ? { ...a, isActive: active } : a
        )
      );
      showToast({
        title: active ? "已重新啟用" : "已停用",
        icon: <ShieldCheck className="text-success" />,
      });
    } catch (e: any) {
      showToast({
        title: active ? "重新啟用失敗" : "停用失敗",
        description: getErrorMessage(e.message),
        icon: <CircleX className="text-error" />,
      });
    }
  };

  const confirmDeactivate = (admin: AdminListItem) => {
    showModal({
      title: `停用 ${admin.name}？`,
      description: "停用後對方會立刻無法登入 admin console，直到重新啟用為止",
      showDismissButton: true,
      buttons: [
        {
          label: "停用",
          role: "error",
          style: "btn-error",
          onClick: () => setAdminActive(admin, false),
        },
      ],
    });
  };

  const activeCount = admins.filter((a) => a.isActive).length;

  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center pt-18">
      {pendingInviteLink && <InviteLinkResultModal link={pendingInviteLink} />}
      <CreateInviteModal onCreated={handleInviteCreated} />

      <nav className="navbar bg-base-100 fixed top-0 z-50 shadow-xs px-3">
        <div className="navbar-start space-x-4">
          <button
            className="btn btn-square btn-ghost"
            onClick={openCreateInviteModal}
          >
            <UserPlus size={22} />
          </button>
        </div>
        <div className="navbar-center">
          <h3 className="font-semibold">成員管理</h3>
        </div>
        <div className="navbar-end">
          <Link to="/admin" className="btn btn-square btn-ghost">
            <House />
          </Link>
        </div>
      </nav>

      <div className="max-w-xl w-full p-4 space-y-4 lg:ms-64">
        <div className="bg-base-100 p-4 rounded-box">
          <div className="flex flex-row items-center gap-6">
            <div className="p-3 rounded-full border border-base-300">
              <Users size={30} />
            </div>
            <div className="flex-1">
              <h2 className="card-title text-xl">組織管理員</h2>
              <p className="text-base-content/60 text-sm mt-1">
                {activeCount} 位啟用中，共 {admins.length} 位成員
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-4 gap-4">
            <div className="flex items-center justify-between">
              <h3 className="card-title text-lg flex items-center gap-2">
                <Link2 size={22} />
                待接受的邀請
              </h3>
              <button
                className="btn btn-primary btn-sm gap-1"
                onClick={openCreateInviteModal}
              >
                <UserPlus size={16} />
                邀請成員
              </button>
            </div>

            {invites.length === 0 ? (
              <p className="text-sm text-base-content/50 py-2">
                目前沒有待接受的邀請
              </p>
            ) : (
              <ul className="space-y-3">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="border border-base-300 rounded-field p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invite.email}</p>
                      <p className="text-xs text-base-content/60 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(invite.expiresAt)} 前有效 ·{" "}
                        {invite.invitedByName} 邀請
                      </p>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm text-error shrink-0"
                      onClick={() => confirmRevokeInvite(invite)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-4 gap-4">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ShieldCheck size={22} />
              成員列表
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner" />
              </div>
            ) : (
              <ul className="space-y-3">
                {admins.map((admin) => {
                  const isSelf = admin.accountId === activeAdmin?.accountId;
                  return (
                    <li
                      key={admin.accountId}
                      className="border border-base-300 rounded-field p-3 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{admin.name}</p>
                          {isSelf && (
                            <span className="badge badge-soft badge-sm whitespace-nowrap">
                              本人
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/60 truncate">
                          {admin.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge badge-info badge-soft badge-sm">
                            {levelLabel(admin.level)}
                          </span>
                          <span
                            className={`badge badge-soft badge-sm ${
                              admin.isActive ? "badge-success" : "badge-error"
                            }`}
                          >
                            {admin.isActive ? "啟用中" : "已停用"}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/40 mt-1">
                          最後登入：{formatDate(admin.lastLoginAt)}
                        </p>
                      </div>

                      {!isSelf && (
                        <button
                          className={`btn btn-sm shrink-0 ${
                            admin.isActive
                              ? "btn-outline btn-error"
                              : "btn-outline btn-success"
                          }`}
                          onClick={() =>
                            admin.isActive
                              ? confirmDeactivate(admin)
                              : setAdminActive(admin, true)
                          }
                        >
                          {admin.isActive ? (
                            <>
                              <ShieldOff size={14} />
                              停用
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} />
                              啟用
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMembersConsole;
