import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useModal } from "../widgets/ModalContext";
import { getErrorMessage, type ErrorCode } from "../utils/errors";
import PageMeta, { routesMeta } from "../widgets/PageMeta";

const LoginFailed = () => {
  const [searchParams] = useSearchParams();
  const { showModal } = useModal();
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();
  const navigate = useNavigate();

  useEffect(() => {
    setNavbarButtonsByType(["themeToggle"]);
    setNavbarTitle("登入失敗");
    showModal({
      title: "登入失敗",
      description: getErrorMessage(searchParams.get("code") as ErrorCode),
      buttons: [
        {
          label: "重新登入",
          style: "btn-primary",
          role: "primary",
          onClick: () => navigate("/choose-school"),
        },
      ],
    });
  }, []);
  return <PageMeta {...routesMeta.loginFailed} />;
};

export default LoginFailed;
