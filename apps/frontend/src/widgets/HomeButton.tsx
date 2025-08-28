import { Home } from "@icons";
import { useNavigate } from "react-router-dom";

const HomeButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/home")}
      className="btn btn-circle btn-ghost ms-2"
    >
      <div className="h-7.5 w-7.5 rounded-4xl flex justify-center items-center">
        <Home className="w-5 h-5 mb-0.5" />
      </div>
    </button>
  );
};

export default HomeButton;
