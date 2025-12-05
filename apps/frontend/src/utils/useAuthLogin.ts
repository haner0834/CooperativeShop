import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export const useAutoLogin = () => {
  const { hasAttemptedRestore, restoreSession } = useAuth();

  useEffect(() => {
    if (!hasAttemptedRestore) {
      restoreSession();
    }
  }, [hasAttemptedRestore, restoreSession]);

  return hasAttemptedRestore;
};
