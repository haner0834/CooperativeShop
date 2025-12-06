import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAutoLogin } from "../utils/useAuthLogin";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { activeUser, isLoading } = useAuth();
  const hasAttemptedRestore = useAutoLogin(); // 使用 hook

  if (!hasAttemptedRestore || isLoading) {
    return (
      <div className="pt-16 w-screen h-screen justify-center flex items-center bg-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <Navigate
        to="/choose-school"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
