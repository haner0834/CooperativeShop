import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useModal } from "../widgets/ModalContext";

const ProtectedGate = () => {
  const { activeUser, hasAttemptedRestore } = useAuth();
  const { showModal } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAttemptedRestore && !activeUser) {
      showModal({
        title: "登入已過期",
        buttons: [
          {
            label: "繼續",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/choose-school"),
          },
        ],
      });
    }
  }, [hasAttemptedRestore, activeUser]);

  return <Outlet />;
};
export default ProtectedGate;
