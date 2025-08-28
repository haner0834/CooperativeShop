import { useNavigate } from "react-router-dom";

const RegisterButton = () => {
  const navigate = useNavigate();
  const toChooseSchool = () => {
    navigate("/choose-school");
  };

  return (
    <button onClick={toChooseSchool} className="btn btn-gost">
      註冊
    </button>
  );
};

export default RegisterButton;
