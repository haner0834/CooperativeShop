import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, type ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { activeUser, isLoading, hasAttemptedRestore, restoreSession } =
    useAuth();

  // 1. 使用 useEffect 在元件掛載時觸發恢復邏輯
  useEffect(() => {
    // 只有在從未嘗試過恢復時，才呼叫 restoreSession
    if (!hasAttemptedRestore) {
      restoreSession();
    }
  }, [hasAttemptedRestore, restoreSession]); // 依賴項確保此 effect 只執行一次

  // 2. 處理載入狀態
  // 如果「還沒嘗試過恢復」或者「正在恢復中」，都顯示載入畫面
  if (!hasAttemptedRestore || isLoading) {
    return (
      <div className="pt-16 w-screen h-screen justify-center flex items-center bg-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p>
          {hasAttemptedRestore ? "true" : "false"},{" "}
          {isLoading ? "true" : "false"}
        </p>
      </div>
    );
  }

  // 3. 處理認證結果
  // 當「嘗試結束」且「沒有活躍使用者」時，重導向到登入頁
  if (hasAttemptedRestore && !activeUser) {
    // 我們可以傳遞 state 來告知登入頁使用者是從哪裡來的
    return (
      <Navigate
        to="/choose-school"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // 4. 認證成功
  // 當「嘗試結束」且「有活躍使用者」時，渲染子元件
  return children;
};

export default ProtectedRoute;
