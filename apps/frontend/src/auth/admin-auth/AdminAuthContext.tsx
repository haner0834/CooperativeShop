import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useRef,
  useEffect,
} from "react";
import { getDeviceId } from "../../utils/device";
import { path } from "../../utils/path";
import { ensureAdminAuth } from "./adminAuthCoordinator";

// --- 1. 定義新的型別 ---

// 後端回傳的 admin 基本資料 (AdminPayload)
// 對應後端 src/auth/types/admin-auth.types.ts 的 AdminPayload
export interface AdminPayload {
  accountId: string;
  adminId: string;
  level: "ORGANIZATION" | "SCHOOL";
  schoolId: string | null;
  email: string;
  name: string;
}

type RestoreResult = { ok: true } | { ok: false; errorCode?: string };

type RestorePromiseControls = {
  /**
   * 這是外部組件 (如 useAdminAuthFetch) await 的 Promise。
   * 它會在會話恢復成功或失敗 (已嘗試) 後被 resolve(true) 或 resolve(false)。
   */
  promise: Promise<RestoreResult>;

  /**
   * 用於手動完成 Promise 的 resolve 函式。
   */
  resolve: (value: RestoreResult) => void;

  /**
   * 用於手動拒絕 Promise 的 reject 函式 (備用)。
   */
  reject: (reason?: any) => void;
};

// AdminAuthContext 的完整型別
// NOTE: 這裡刻意沒有 switchableAccounts / switchAccount ——
// admin 帳號跟 student 帳號完全不共用，也沒有「切換帳號」這個概念。
type AdminAuthContextType = {
  accessToken: string | null;
  tokenRef: React.RefObject<string | null>;
  activeAdmin: AdminPayload | null;
  activeAdminRef: React.RefObject<AdminPayload | null>;
  isLoading: boolean; // 這個 loading 現在代表「正在進行某項認證操作」
  isLoadingRef: React.RefObject<boolean>;
  hasAttemptedRestore: boolean; // 標記是否已嘗試過恢復
  restorePromise: Promise<RestoreResult>;
  login: (loginFunction: Promise<any>) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>; // 暴露給 AdminProtectedGate 的恢復函式
  refreshAccessToken: () => Promise<string>;
  setAccessToken: (accessToken: string | null) => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [activeAdmin, setActiveAdmin] = useState<AdminPayload | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  const [restorePromiseControls] = useState<RestorePromiseControls>(() => {
    let res: (value: RestoreResult) => void;
    let rej: (reason?: any) => void;

    // 建立一個會被 `RestoreResult` resolve 的 Promise
    const promise = new Promise<RestoreResult>((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    // 將 Promise 及其控制器返回
    return {
      promise,
      resolve: res!,
      reject: rej!,
    };
  });

  // Use ref to update access token immediately instead of
  // wait until `accessToken` re-generate. This would be helpful
  // for calling `adminAuthedFetch` twice because using `ref` could
  // get up-to-date access token.
  const tokenRef = useRef<string | null>(accessToken);

  // NOTE: Not to use `useEffect` for updating `tokenRef.current`,
  // same race-condition reasoning as the student-side AuthContext:
  // restoreSession -> authedFetch 可能會在 useEffect 真的跑之前
  // 就用到過期的 tokenRef.current，所以在 setState 當下同步寫 ref。

  const setAccessTokenAndTokenRef = (newToken: string | null) => {
    setAccessToken(newToken);
    tokenRef.current = newToken;
  };

  const isLoadingRef = useRef<boolean>(isLoading);
  const setIsLoadingAndRef = (isLoading: boolean) => {
    setIsLoading(isLoading);
    isLoadingRef.current = isLoading;
  };

  const activeAdminRef = useRef<AdminPayload | null>(null);
  const setActiveAdminAndRef = (admin: AdminPayload | null) => {
    setActiveAdmin(admin);
    activeAdminRef.current = admin;
  };

  useEffect(() => {
    if (!activeAdmin) {
      ensureAdminAuth(restoreSession);
    }
  }, []);

  // --- 2. 處理認證成功後的通用邏輯 ---
  const handleAuthSuccess = (data: any) => {
    const { accessToken, admin } = data;
    if (!accessToken || !admin) {
      throw new Error("Invalid response from server after auth.");
    }
    setAccessTokenAndTokenRef(accessToken);
    setActiveAdminAndRef(admin);
  };

  // --- 3. 核心認證函式 ---

  const rawRefreshFunc = useCallback(async (): Promise<string> => {
    if (activeAdmin && tokenRef.current) {
      return tokenRef.current;
    }
    // 刷新 Token 時也需要 deviceId
    const res = await fetch(path("/api/auth/admin/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(), // 攜帶 Device ID
      },
    });

    const json = await res.json();

    if (!res.ok || !json.success || !json.data.accessToken) {
      // 刷新失敗，清空所有狀態
      setActiveAdminAndRef(null);
      setAccessTokenAndTokenRef(null);
      throw new Error(json.error?.code);
    }

    setAccessTokenAndTokenRef(json.data.accessToken);
    return json.data.accessToken;
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    return ensureAdminAuth(rawRefreshFunc);
  }, [rawRefreshFunc]);

  const restoreSession = useCallback(async () => {
    setIsLoadingAndRef(true);
    try {
      const res = await fetch(path("/api/auth/admin/restore"), {
        method: "POST",
        credentials: "include",
        headers: { "X-Device-ID": getDeviceId() },
      });
      const json = await res.json();
      if (json.success) {
        handleAuthSuccess(json.data);
        restorePromiseControls.resolve({ ok: true });
      } else {
        restorePromiseControls.resolve({
          ok: false,
          errorCode: json.error?.code,
        });
      }
    } catch (error) {
      console.log("No active admin session to restore.");
      restorePromiseControls.resolve({
        ok: false,
        errorCode: (error as any).message,
      });
      // 即使失敗，也算是一次成功的「嘗試」
    } finally {
      setIsLoadingAndRef(false);
      setHasAttemptedRestore(true);
    }
  }, []);

  // 提供一個通用的登入函式，可以接收任何登入 API 的 promise
  // (例如 /auth/admin/login 或 /auth/admin/invites/:token/accept，
  // 兩者回傳的 shape 都是 { accessToken, admin })
  const login = async (loginPromise: Promise<any>) => {
    const response = await loginPromise;
    if (!response.success) {
      throw new Error(response.error?.code);
    }

    handleAuthSuccess(response.data);
  };

  const logout = async () => {
    const res = await fetch(path("/api/auth/admin/logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();

    setActiveAdminAndRef(null);
    setAccessTokenAndTokenRef(null);

    if (!json.success) {
      throw new Error(json.error?.code);
    }
  };

  // 傳遞給 Provider 的值
  const value: AdminAuthContextType = {
    activeAdmin,
    activeAdminRef,
    accessToken,
    tokenRef,
    isLoadingRef,
    isLoading,
    restorePromise: restorePromiseControls.promise,
    login,
    logout,
    refreshAccessToken,
    hasAttemptedRestore,
    restoreSession,
    setAccessToken: setAccessTokenAndTokenRef,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
