import { School, UserRound } from "lucide-react";
import QuestionBlock from "./QuestionBlock";
import ResponsiveSheet from "../../widgets/ResponsiveSheet";
import { useState } from "react";
import { SwictableAccountsSheet } from "../../widgets/SwitchableAccountSheet";
import { useAuth } from "../../auth/AuthContext";

const ShopSignedSchool = ({
  schoolAbbreviation,
  showHint,
}: {
  schoolAbbreviation: string;
  showHint: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { switchAccount, activeUser } = useAuth();

  const handleSwitch = (id: string) => {
    if (id === activeUser?.id) return;
    switchAccount(id);
  };

  return (
    // Use div because father container's spaxe-y-n will affect the sheet
    // and push it up from the bottom of the screen
    <div>
      <QuestionBlock
        title="簽約校"
        description="此部分由登入之帳號決定"
        status={schoolAbbreviation ? "ok" : "required"}
        hint="fuck, contact damn developer"
        showHint={showHint}
      >
        <div className="flex justify-between items-center">
          <span className="badge badge-warning badge-soft uppercase">
            <School className="w-5 h-5" />
            {schoolAbbreviation}
          </span>

          <button
            className="btn btn-primary btn-soft btn-sm"
            onClick={() => setIsOpen(true)}
          >
            <UserRound className="w-4 h-4" />
            切換帳號
          </button>
        </div>
      </QuestionBlock>

      <ResponsiveSheet
        isOn={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <SwictableAccountsSheet handleSwitch={handleSwitch} />
      </ResponsiveSheet>
    </div>
  );
};

export default ShopSignedSchool;
