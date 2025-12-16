import { ChevronLeft } from "lucide-react";
import { usePathHistory } from "../contexts/PathHistoryContext";

const BackButton = ({ label = "返回" }: { label?: string }) => {
  const { goBack } = usePathHistory();

  return (
    <button
      className="flex items-center focus:opacity-40"
      onClick={() => goBack()}
    >
      <ChevronLeft className="w-7 h-7" />
      {label}
    </button>
  );
};

export default BackButton;
