import { createContext, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

type PathHistoryContextType = {
  history: string[];
  previous: string | null;
  goBack: (fallback?: string) => void;
};

const PathHistoryContext = createContext<PathHistoryContextType | null>(null);

export function PathHistoryProvider({
  children,
  fallback = "/",
}: {
  children: React.ReactNode;
  fallback?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const action = useNavigationType(); // 取得導航行為：PUSH, POP, 或 REPLACE

  const historyRef = useRef<string[]>([]);
  const currentPathRef = useRef<string>(location.pathname + location.search);

  useEffect(() => {
    const nextPath = location.pathname + location.search;

    // 1. 如果是使用者點擊連結進入新頁面 (PUSH)
    if (action === "PUSH") {
      // 把「跳轉前」的路徑存入歷史
      historyRef.current.push(currentPathRef.current);
    }

    // 2. 如果是瀏覽器後退或執行了 navigate(-1) (POP)
    if (action === "POP") {
      // 移除最後一筆，因為我們已經回到那一頁了
      historyRef.current.pop();
    }

    // 更新當前指針，供下次跳轉時紀錄
    currentPathRef.current = nextPath;
  }, [location.pathname, location.search, action]);

  const goBack = (localFallback?: string) => {
    if (historyRef.current.length > 0) {
      // 這裡直接使用 navigate(-1)，讓瀏覽器處理 POP 行為
      // 這會觸發上面的 action === "POP" 邏輯，正確清理堆疊
      navigate(-1);
    } else {
      // 若無紀錄則跳轉至回退路徑，並使用 replace 避免產生多餘歷史
      navigate(localFallback ?? fallback, { replace: true });
    }
  };

  return (
    <PathHistoryContext.Provider
      value={{
        history: historyRef.current,
        previous: historyRef.current[historyRef.current.length - 1] ?? null,
        goBack,
      }}
    >
      {children}
    </PathHistoryContext.Provider>
  );
}

export function usePathHistory() {
  const ctx = useContext(PathHistoryContext);
  if (!ctx)
    throw new Error("usePathHistory must be used inside PathHistoryProvider");
  return ctx;
}
