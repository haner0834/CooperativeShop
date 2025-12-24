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
import { ensureAuth } from "./authCoordinator";

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

type RestoreResult = { ok: true } | { ok: false; errorCode?: string };

type RestorePromiseControls = {
  /**
   * 這是外部組件 (如 useAuthFetch) await 的 Promise。
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

// AuthContext 的完整型別
type AuthContextType = {
  accessToken: string | null;
  tokenRef: React.RefObject<string | null>;
  activeUser: UserPayload | null;
  activeUserRef: React.RefObject<UserPayload | null>;
  switchableAccounts: SwitchableAccount[];
  isLoading: boolean; // 這個 loading 現在代表「正在進行某項認證操作」
  isLoadingRef: React.RefObject<boolean>;
  hasAttemptedRestore: boolean; // ✨ 新增：標記是否已嘗試過恢復
  restorePromise: Promise<RestoreResult>;
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
  // for calling `authedFetch` twice because using `ref` could
  // get up-to-date access token.
  const tokenRef = useRef<string | null>(accessToken);

  // NOTE: Not to use `useEffect` for updating `tokenRef.current`
  // because `useEffect` runs at the next round, which is
  // slow enough to make a race condition.
  //
  // EXAMPLE:
  // 1. `restoreSession` runs globally
  // 2. user enter `Home`, triggered `getQrData` by calling `authedFetch`
  // 3. `authedFetch` wait until `ensureAuth` complete promise(held by `restoreSession`)
  // 4. `authedFetch` start fetching data by using old `tokenRef.current`, which is `null`
  // 5. `authedFetch` failed -> auto retry -> `refreshAccessToken` called
  // 6. `refreshAccessToken` succeed -> `authedFetch` use new token (from its return value)
  // 7. `authedFetch` fetch data again -> succeed -> return
  // 8. React render
  // 9. `useEffect` update `tokenRef.current`

  // useEffect(() => {
  //   tokenRef.current = accessToken;
  // }, [accessToken]);

  const setAccessTokenAndTokenRef = (newToken: string | null) => {
    setAccessToken(newToken);
    tokenRef.current = newToken;
  };

  // And yeah obviously there's exposed function for setting
  // new access token. So the solution here is to expose
  // `setAccessTokenAndTokenRef` as `setAccessToken`.
  // Guess what, I'm like a joker. fuck react.
  // Why the fuck managing data flow has to be aware
  // of so fucking many things?

  const isLoadingRef = useRef<boolean>(isLoading);
  const setIsLoadingAndRef = (isLoading: boolean) => {
    setIsLoading(isLoading);
    isLoadingRef.current = isLoading;
  };

  const activeUserRef = useRef<UserPayload | null>(null);
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) {
      ensureAuth(restoreSession);
    }
  }, []);

  // --- 2. 處理認證成功後的通用邏輯 ---
  const handleAuthSuccess = (data: any) => {
    const { accessToken, user, switchableAccounts } = data;
    if (!accessToken || !user) {
      throw new Error("Invalid response from server after auth.");
    }
    setAccessTokenAndTokenRef(accessToken);
    setActiveUser(user);
    setSwitchableAccounts(switchableAccounts || []);
  };

  // --- 3. 核心認證函式 ---

  const rawRefreshFunc = useCallback(async (): Promise<string> => {
    if (activeUser && tokenRef.current) {
      return tokenRef.current;
    }
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
      setAccessTokenAndTokenRef(null);
      setSwitchableAccounts([]);
      throw new Error(json.error?.code);
    }

    setAccessTokenAndTokenRef(json.data.accessToken);
    return json.data.accessToken;
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    return ensureAuth(rawRefreshFunc);
  }, [rawRefreshFunc]);

  const restoreSession = useCallback(async () => {
    setIsLoadingAndRef(true);
    try {
      const res = await fetch(path("/api/auth/restore"), {
        method: "POST",
        credentials: "include",
        headers: { "X-Device-ID": getDeviceId() },
      });
      const json = await res.json();
      if (json.success) {
        handleAuthSuccess(json.data);
        restorePromiseControls.resolve({ ok: true });
        // return json.data.accessToken;
      } else {
        restorePromiseControls.resolve({
          ok: false,
          errorCode: json.error?.code,
        });
      }
    } catch (error) {
      console.log("No active session to restore.");
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
  const login = async (loginPromise: Promise<any>) => {
    const response = await loginPromise;
    if (!response.success) {
      // 可以在這裡處理登入失敗的通用邏輯，例如顯示錯誤訊息
      throw new Error(response.error?.code);
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
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ targetUserId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.code);

    // 切換成功後，後端只回傳新的 accessToken 和 user
    const { accessToken: newAccessToken, user: newUser } = json.data;
    setAccessTokenAndTokenRef(newAccessToken);
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
    setAccessTokenAndTokenRef(null);
    setSwitchableAccounts([]);

    if (!json.success) {
      throw new Error(json.error?.code);
    }
  };

  // 傳遞給 Provider 的值
  const value: AuthContextType = {
    activeUser,
    activeUserRef,
    accessToken,
    tokenRef,
    isLoadingRef,
    switchableAccounts,
    isLoading,
    restorePromise: restorePromiseControls.promise,
    login,
    logout,
    switchAccount,
    refreshAccessToken,
    hasAttemptedRestore,
    restoreSession,
    setAccessToken: setAccessTokenAndTokenRef,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
