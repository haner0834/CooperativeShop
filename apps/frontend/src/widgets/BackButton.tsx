import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const BackButton = ({ label = "返回" }: { label?: string }) => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <button className="flex items-center focus:opacity-40" onClick={goBack}>
      <ChevronLeft className="w-7 h-7" />
      {label}
    </button>
  );
};

export default BackButton;
