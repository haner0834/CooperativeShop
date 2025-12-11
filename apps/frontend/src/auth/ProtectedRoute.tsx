import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { activeUser, hasAttemptedRestore, isLoadingRef } = useAuth();

  if (!isLoadingRef.current) {
    return (
      <div className="pt-16 w-screen h-screen justify-center flex items-center bg-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (hasAttemptedRestore && !activeUser) {
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
