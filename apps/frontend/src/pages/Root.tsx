import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PageMeta, { routesMeta } from "../widgets/PageMeta";
import { getErrorMessage } from "../utils/errors";
import { useModal } from "../widgets/ModalContext";

const Root = () => {
  const navigate = useNavigate();
  const { hasAttemptedRestore, activeUser } = useAuth();
  const { showModal } = useModal();

  useEffect(() => {
    if (!hasAttemptedRestore) return;

    // Get whether the device has logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      if (activeUser) {
        navigate("/home", { replace: true });
      } else {
        showModal({
          title: "登入已過期",
          description: getErrorMessage("EXPIRED_LOGIN"),
          buttons: [{ label: "OK" }],
        });
        navigate("/choose-school", { replace: true });
      }
    } else {
      navigate("/intro", { replace: true });
    }
  }, [hasAttemptedRestore, activeUser]);

  return <PageMeta {...routesMeta.root} />;
};

export default Root;
