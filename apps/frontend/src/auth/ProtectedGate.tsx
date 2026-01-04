import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useModal } from "../widgets/ModalContext";

const ProtectedGate = () => {
  const { activeUser, hasAttemptedRestore } = useAuth();
  const { showModal, hideModal } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAttemptedRestore && !activeUser) {
      showModal({
        title: "請重新登入",
        description: "登入已過期，重新登入以進行下一步操作",
        buttons: [
          {
            label: "繼續",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/choose-school"),
          },
        ],
      });
    } else {
      hideModal();
    }
  }, [hasAttemptedRestore, activeUser]);

  return <Outlet />;
};
export default ProtectedGate;
