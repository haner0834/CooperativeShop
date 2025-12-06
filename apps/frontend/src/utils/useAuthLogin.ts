import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export const useAutoLogin = () => {
  const { hasAttemptedRestore, activeUser, restoreSession } = useAuth();

  useEffect(() => {
    if (!hasAttemptedRestore || !activeUser) {
      restoreSession();
    }
  }, [hasAttemptedRestore, restoreSession]);

  return hasAttemptedRestore;
};
