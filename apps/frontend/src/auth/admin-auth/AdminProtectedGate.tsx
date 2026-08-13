import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "./AdminAuthContext";
import { useLocation } from "react-router-dom";

const AdminProtectedGate = () => {
  const { activeAdmin, hasAttemptedRestore } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAttemptedRestore && !activeAdmin) {
      navigate(`/admin/login?to=${encodeURI(location.pathname)}`);
    }
  }, [hasAttemptedRestore, activeAdmin]);

  return <Outlet />;
};
export default AdminProtectedGate;
