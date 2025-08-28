import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage } from "../utils/errors";

const Root = () => {
  const navigate = useNavigate();
  const { refreshAccessToken, accessToken } = useAuth();
  const { showModal } = useModal();
  // Get whether the device has logged in
  useEffect(() => {
    const checkLoginAndNavigate = async () => {
      try {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn === "true") {
          if (!accessToken) {
            await refreshAccessToken();
          }
          navigate("/home");
        } else {
          navigate("/intro");
        }
      } catch (error) {
        console.error("Error refreshing access token:", error);
        navigate("/choose-school");
        showModal({
          title: "登入已過期",
          description: getErrorMessage("EXPIRED_LOGIN"),
          buttons: [
            {
              label: "OK",
            },
          ],
        });
      }
    };

    checkLoginAndNavigate();
  }, []);

  return null;
};

export default Root;
