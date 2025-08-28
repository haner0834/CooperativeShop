import { useNavigate } from "react-router-dom";

const LoginButton = () => {
  const navigate = useNavigate();
  const toLoginPage = () => {
    navigate("/choose-school");
  };

  return (
    <button onClick={toLoginPage} className="btn btn-gost">
      登入
    </button>
  );
};

export default LoginButton;
