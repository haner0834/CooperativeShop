import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useModal } from "../widgets/ModalContext";

const ProtectedGate = () => {
  const { activeUser, hasAttemptedRestore, isLoading } = useAuth();
  const { showModal, hideModal } = useModal();
  const navigate = useNavigate();
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    // 只有在：
    // 1. 已經嘗試過恢復 (hasAttemptedRestore === true)
    // 2. 當前不在 Loading 狀態 (確保 Context 更新完畢)
    // 3. 確定沒有 activeUser
    // 4. 還沒彈過窗
    if (hasAttemptedRestore && !isLoading && !activeUser && !modalShown) {
      setModalShown(true);
      showModal({
        title: "登入已過期",
        description: "請重新登入以繼續使用。",
        buttons: [
          {
            label: "繼續",
            role: "primary",
            style: "btn-primary",
            onClick: () => {
              navigate("/choose-school");
            },
          },
        ],
      });
    } else {
      hideModal();
    }
  }, [hasAttemptedRestore, isLoading, activeUser, modalShown]);

  // 如果還在恢復中，且還沒有使用者，先不要渲染 Outlet 內容，避免子元件(Home)觸發報錯的請求
  if (!hasAttemptedRestore || (isLoading && !activeUser)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedGate;
