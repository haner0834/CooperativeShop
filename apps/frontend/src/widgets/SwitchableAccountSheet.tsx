import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Avator } from "../pages/Home";
import type { LoginMethod } from "../types/school";
import { useModal } from "./ModalContext";

export const SwictableAccountsSheet = ({
  handleSwitch,
}: {
  handleSwitch: (id: string) => void;
}) => {
  const { switchableAccounts, activeUser, logout } = useAuth();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const askLogout = () => {
    showModal({
      title: "確認登出目前帳號？",
      description: `您將登出目前帳號`,
      buttons: [
        {
          label: "取消",
        },
        {
          label: "登出",
          style: "btn-error",
          role: "error",
          onClick: handleLogout,
        },
      ],
    });
  };

  const handleLogout = async () => {
    logout();
  };

  return (
    <div className="relative md:h-screen">
      <ul className="space-y-4">
        {switchableAccounts.map((account) => {
          const loginMethod: LoginMethod = account.email
            ? "google"
            : "credential";

          return (
            <li
              key={account.name}
              onClick={() => handleSwitch(account.id)}
              className="flex items-center"
            >
              <div className="flex items-center space-x-2 w-full">
                <Avator method={loginMethod} />
                <div className="">
                  <p className="w-full font-medium">{account.name}</p>
                  <p className="text-xs opacity-50">
                    {account.email || account.providerAccountId || "Unknown"}
                  </p>
                </div>
              </div>

              {activeUser?.id === account.id && (
                <div className="rounded-full p-1 bg-accent">
                  <Check className="w-4 h-4 text-base-100" strokeWidth={3} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="w-full md:absolute md:bottom-18">
        <button
          onClick={() => navigate("/choose-school")}
          className="btn w-full btn-primary mt-4"
        >
          登入新帳號
        </button>
        <button
          onClick={askLogout}
          className="btn w-full btn-error btn-soft mt-4"
        >
          登出目前帳號
        </button>
      </div>
    </div>
  );
};
