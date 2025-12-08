import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useRef,
  useEffect,
} from "react";
import { getDeviceId } from "../utils/device";
import { path } from "../utils/path";

// --- 1. 定義新的型別 ---

// 後端回傳的使用者基本資料 (StudentPayload)
type UserPayload = {
  id: string;
  name: string;
  schoolId: string;
  schoolAbbr: string;
};

// 後端回傳的可切換帳號資料
export type SwitchableAccount = {
  id: string;
  name: string;
  providerAccountId: string;
  email: string;
  schoolId: string;
};

// AuthContext 的完整型別
type AuthContextType = {
  accessToken: string | null;
  tokenRef: React.RefObject<string | null>;
  activeUser: UserPayload | null;
  switchableAccounts: SwitchableAccount[];
  isLoading: boolean; // 這個 loading 現在代表「正在進行某項認證操作」
  hasAttemptedRestore: boolean; // ✨ 新增：標記是否已嘗試過恢復
  login: (loginFunction: Promise<any>) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (targetUserId: string) => Promise<void>;
  restoreSession: () => Promise<void>; // ✨ 新增：暴露給 ProtectedRoute 的恢復函式
  refreshAccessToken: () => Promise<string>;
  setAccessToken: (accessToken: string | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<UserPayload | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [switchableAccounts, setSwitchableAccounts] = useState<
    SwitchableAccount[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  // Use ref to update access token immediately instead of
  // wait until `accessToken` re-generate. This would be helpful
  // for calling `authedFetch` twice because using `ref` could
  // get up-to-date access token.
  const tokenRef = useRef<string | null>(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!activeUser) {
      restoreSession();
    }
  }, []);

  // --- 2. 處理認證成功後的通用邏輯 ---
  const handleAuthSuccess = (data: any) => {
    const { accessToken, user, switchableAccounts } = data;
    if (!accessToken || !user) {
      throw new Error("Invalid response from server after auth.");
    }
    setAccessToken(accessToken);
    setActiveUser(user);
    setSwitchableAccounts(switchableAccounts || []);
  };

  // --- 3. 核心認證函式 ---

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    // 刷新 Token 時也需要 deviceId
    const res = await fetch(path("/api/auth/refresh"), {
      // 請確認您的後端 Port
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
      setActiveUser(null);
      setAccessToken(null);
      setSwitchableAccounts([]);
      throw new Error("Unable to refresh access token.");
    }

    setAccessToken(json.data.accessToken);
    return json.data.accessToken;
  }, []);

  const restoreSession = useCallback(async () => {
    // 如果已經嘗試過，或正在載入，則直接返回，防止重複呼叫
    if (hasAttemptedRestore || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(path("/api/auth/restore"), {
        method: "POST",
        credentials: "include",
        headers: { "X-Device-ID": getDeviceId() },
      });
      const json = await res.json();
      if (json.success) {
        handleAuthSuccess(json.data);
      }
    } catch (error) {
      console.log("No active session to restore.");
      // 即使失敗，也算是一次成功的「嘗試」
    } finally {
      setIsLoading(false);
      setHasAttemptedRestore(true);
    }
  }, [isLoading, hasAttemptedRestore]);

  // 提供一個通用的登入函式，可以接收任何登入 API 的 promise
  const login = async (loginPromise: Promise<any>) => {
    const response = await loginPromise;
    if (!response.success) {
      // 可以在這裡處理登入失敗的通用邏輯，例如顯示錯誤訊息
      throw new Error(response.error?.message || "Login failed");
    }
    handleAuthSuccess(response.data);
  };

  const switchAccount = async (targetUserId: string) => {
    const res = await fetch(path("/api/auth/switch-account"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
      },
      body: JSON.stringify({ targetUserId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to switch account");

    // 切換成功後，後端只回傳新的 accessToken 和 user
    const { accessToken: newAccessToken, user: newUser } = json.data;
    setAccessToken(newAccessToken);
    setActiveUser(newUser);
  };

  const logout = async () => {
    // 理想情況下，應該呼叫後端登出 API 來清除 session
    const res = await fetch(path("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await res.json();

    setActiveUser(null);
    setAccessToken(null);
    setSwitchableAccounts([]);

    if (!json.success) {
      throw new Error("Failed to logout");
    }
  };

  // 傳遞給 Provider 的值
  const value: AuthContextType = {
    activeUser,
    accessToken,
    tokenRef,
    switchableAccounts,
    isLoading,
    login,
    logout,
    switchAccount,
    refreshAccessToken,
    hasAttemptedRestore,
    restoreSession,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
