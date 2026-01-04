import { Fragment, useState } from "react";
import {
  User as UserIcon,
  School,
  Mail,
  Smartphone,
  LogOut,
  Shield,
  CreditCard,
  ChevronRight,
  Menu,
  Pencil,
  User,
  Bookmark,
  CircleX,
  Copy,
  MonitorSmartphone,
  Tablet,
  LaptopMinimal,
  Monitor,
  TabletSmartphone,
  MonitorX,
  Contact,
  IdCard,
} from "lucide-react";
import { SidebarContent } from "../widgets/SidebarContent";
import Sidebar from "../widgets/Sidebar";
import { useToast } from "../widgets/Toast/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import type { LoginMethod } from "../types/school";
import { Avator } from "./Home";
import { useModal } from "../widgets/ModalContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import { path } from "../utils/path";
import { getErrorMessage } from "../utils/errors";

type DeviceType = "iPhone" | "iPad" | "Mac" | "Windows" | "Android" | "Other";

interface Session {
  id: string;
  deviceId: string;
  deviceType: string | null;
  ipAddress: string | null;
  browser: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  isCurrent: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const renderDevice = (deviceType: DeviceType, size = 30) => {
  switch (deviceType) {
    case "iPhone":
      return <Smartphone size={size} />;
    case "iPad":
      return <Tablet size={size} />;
    case "Mac":
      return <Monitor size={size} />;
    case "Windows":
      return <LaptopMinimal size={size} />;
    case "Android":
      return <TabletSmartphone size={size} />;
    case "Other":
      return <MonitorX size={size} />;
  }
};

const SessionDetailModal = ({
  session,
  revokeSession,
}: {
  session: Session;
  revokeSession: () => Promise<void>;
}) => {
  const { showModal } = useModal();
  const showRevokeModal = () => {
    showModal({
      title: `確認登出 ${session.deviceType} ？`,
      description: "注意：此操作無法返回",
      showDismissButton: true,
      buttons: [
        {
          label: `登出 ${session.deviceType}`,
          role: "error",
          style: "btn-error",
          onClick: revokeSession,
        },
      ],
    });
  };

  const sessionFields = [
    { label: "瀏覽器", value: session.browser ?? "Unknown" },
    {
      label: "地點",
      value: `${session.country ?? "Unknown"}, ${session.city ?? "Unknown"}`,
    },
    { label: "首次使用", value: formatDate(session.createdAt) },
    { label: "最後使用", value: formatDate(session.updatedAt) },
  ];

  return (
    <dialog id="session_modal" className="modal">
      <div className="modal-box flex flex-col gap-4 p-4">
        <h3 className="text-center font-semibold">裝置詳情</h3>

        <div className="border border-base-300 rounded-field p-4 flex flex-col gap-3">
          <div className="w-full items-center flex flex-col">
            {renderDevice(session.deviceType as any, 40)}

            <p className="font-bold">{session.deviceType}</p>
          </div>
          {sessionFields.map((field, idx) => (
            <Fragment key={idx}>
              <div className="h-[1px] bg-base-300" />
              <div className="flex justify-between">
                <span>{field.label}</span>
                <span>{field.value}</span>
              </div>
            </Fragment>
          ))}
        </div>

        <form method="dialog" className="flex gap-2">
          <div tabIndex={0} autoFocus className="sr-only" />
          {!session.isCurrent && (
            <button className="btn btn-error flex-1" onClick={showRevokeModal}>
              登出該裝置
            </button>
          )}
          <button className="btn flex-1">關閉</button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

const UserAccountCenter = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const { showToast } = useToast();
  const { showModal } = useModal();
  const { switchableAccounts, activeUser, switchAccount, logout } = useAuth();

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const { authedFetch } = useAuthFetch();

  const [sessions] = useState<Session[]>([
    {
      id: "sess_1",
      deviceId: "abc_def",
      deviceType: "iPhone",
      updatedAt: "2023-12-28T12:00:00Z",
      isCurrent: true,
      ipAddress: "1.1.1.1",
      browser: "Safari",
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      userAgent: "Fuck You",
      country: "Taiwan",
      city: "Tainan",
    },
    {
      id: "sess_2",
      deviceId: "ghi_jkl",
      deviceType: "Mac",
      updatedAt: "2023-12-25T08:30:00Z",
      isCurrent: false,
      ipAddress: null,
      browser: null,
      createdAt: "",
      expiresAt: null,
      userAgent: null,
      country: null,
      city: null,
    },
  ]);

  const copyText = async (textToCopy: string | null | undefined) => {
    try {
      if (!textToCopy) throw new Error();
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        title: "複製成功",
        icon: <Copy className="text-success" />,
      });
    } catch {
      showToast({
        title: "複製失敗",
        icon: <CircleX className="text-error" />,
      });
    }
  };

  const handleLogout = () => {
    showModal({
      title: "確認登出？",
      description: "此操作無法回復",
      showDismissButton: true,
      buttons: [
        {
          label: "登出",
          role: "error",
          style: "btn-error",
          onClick: logout,
        },
      ],
    });
  };

  const showRevokeModal = () => {
    showModal({
      title: `確認登出 ${selectedSession?.deviceType} ？`,
      description: "注意：此操作無法返回",
      showDismissButton: true,
      buttons: [
        {
          label: `登出 ${selectedSession?.deviceType}`,
          role: "error",
          style: "btn-error",
          onClick: handleRevoke,
        },
      ],
    });
  };

  const openModal = () => {
    const modal = document.getElementById(
      "session_modal"
    ) as HTMLDialogElement | null;
    modal?.showModal();
  };

  const openSessionDetailModal = (session: Session) => {
    setSelectedSession(session);
    openModal();
  };

  const handleRevoke = async () => {
    if (!selectedSession) return;
    try {
      const res = await authedFetch(
        path(`/api/accounts/${selectedSession.id}/revoke`)
      );
      // res should be nothing
      // let's fuck it
      if (!res.success) {
        throw new Error(res.error.code);
      }
    } catch (e: any) {
      showModal({
        title: "無法登出該裝置",
        description: getErrorMessage(e.message),
        showDismissButton: true,
      });
    }
  };

  const handleSwitch = async (id: string) => {
    if (activeUser?.id !== id) {
      await switchAccount(id);
    }
  };

  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center pt-18">
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          revokeSession={handleRevoke}
        />
      )}
      <nav className="navbar bg-base-100 fixed top-0 z-50 shadow-xs">
        <div className="navbar-start space-x-4">
          <button
            className="btn btn-square btn-ghost"
            onClick={() => setShowSidebar((prev) => !prev)}
          >
            <Menu />
          </button>
        </div>
        <div className="navbar-center">
          <h3 className="font-semibold">帳號中心</h3>
        </div>
        <div className="navbar-end">
          <button className="btn btn-circle btn-ghost">
            <Pencil size={22} />
          </button>
        </div>
      </nav>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      <div className="max-w-xl w-full p-4 space-y-4 lg:ms-64">
        <div className="bg-base-100 p-4 rounded-box">
          <div className="flex flex-row items-center gap-6">
            <div className="p-3 rounded-full border border-base-300">
              <User size={30} />
            </div>
            <div className="flex-1">
              <h2 className="card-title text-xl">{activeUser?.name}</h2>
              <p className="text-base-content/60 text-sm mt-1">
                加入於 {activeUser && formatDate(activeUser.joinAt)}
              </p>
            </div>
            {activeUser?.schoolAbbr && (
              <div className="badge badge-soft ml-2 gap-1">
                <School size={14} />
                {activeUser.schoolAbbr}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/shops?type=saved"
            className="rounded-box bg-base-100 cursor-pointer"
          >
            <div className="flex flex-row items-center p-4 gap-4">
              <div className="">
                <Bookmark size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base">我的收藏</h3>
                <p className="text-xs text-base-content/60">查看已儲存的商家</p>
              </div>
              <ChevronRight className="ml-auto text-base-content/30" />
            </div>
          </a>

          <a href="/schools/me" className="card bg-base-100 cursor-pointer">
            <div className="card-body flex-row items-center p-4 gap-4">
              <div className="">
                <School size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-base">學校資訊</h3>
                <p className="text-xs text-base-content/60">查看我的學校</p>
              </div>
              <ChevronRight className="ml-auto text-base-content/30" />
            </div>
          </a>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-4">
            <h3 className="card-title text-base flex items-center gap-2">
              <UserIcon size={24} />
              帳號資訊
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-base">ID</p>
                  </div>
                </div>
                <button
                  onClick={() => copyText(activeUser?.id)}
                  className="btn btn-xs"
                >
                  <span className="font-mono">
                    {activeUser?.id || "未設定"}
                  </span>
                </button>
              </div>

              {activeUser?.provider === "credentials" ? (
                <div className="flex items-center justify-between py-2 border-b border-base-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                      <IdCard size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-base">學號</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyText(activeUser.studentId)}
                    className="btn btn-xs"
                  >
                    <span className="font-mono">
                      {activeUser?.studentId || "未設定"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2 border-b border-base-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-base">電子郵件</p>
                    </div>
                  </div>
                  <span className="">{activeUser?.email || "未綁定"}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-base">登入方式</p>
                  </div>
                </div>
                <span className="badge badge-info badge-soft">
                  {activeUser?.provider === "google"
                    ? "Google 帳號"
                    : "學號/密碼"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-4">
            <h3 className="card-title text-lg flex items-center gap-2">
              <MonitorSmartphone size={24} />
              登入裝置
            </h3>

            <div className="flex flex-col gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => openSessionDetailModal(session)}
                  className="relative border border-base-300 rounded-field p-4 flex flex-row items-center gap-4 cursor-pointer"
                >
                  <div className="absolute top-2 right-2">
                    {session.isCurrent ? (
                      <div className="badge badge-success badge-soft badge-sm gap-1">
                        當前裝置
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSession(selectedSession);
                          showRevokeModal();
                        }}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        登出此裝置
                      </button>
                    )}
                  </div>

                  {session.deviceType &&
                    renderDevice(session.deviceType as DeviceType)}

                  <div className="w-full">
                    <span className="text-base font-semibold">
                      {session.deviceType}
                    </span>
                    <div className="flex justify-between text-sm text-base-content/70">
                      <span>
                        {session.country ?? "Unknown"},{" "}
                        {session.city ?? "Unknown"}
                      </span>
                      <span>{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-4 gap-4">
            <h3 className="card-title text-lg flex items-center gap-2">
              <Contact size={24} />
              此裝置上的帳號
            </h3>

            <ul className="space-y-4">
              {switchableAccounts.map((account) => {
                const loginMethod: LoginMethod = account.email
                  ? "google"
                  : "credential";

                return (
                  <li key={account.name} className="flex items-center">
                    <div className="flex items-center space-x-2 w-full">
                      <Avator method={loginMethod} />
                      <div className="">
                        <p className="w-full font-medium">{account.name}</p>
                        <p className="text-xs opacity-50">
                          {account.email ||
                            account.providerAccountId ||
                            "Unknown"}
                        </p>
                      </div>
                    </div>

                    {activeUser?.id === account.id ? (
                      <span className="badge badge-success badge-soft whitespace-nowrap">
                        目前帳號
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitch(account.id)}
                        className="btn btn-ghost whitespace-nowrap"
                      >
                        切換
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            className="btn btn-outline btn-error w-full flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            登出目前的帳號
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAccountCenter;
