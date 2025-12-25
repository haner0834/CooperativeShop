import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const LoginButton = () => {
  const { activeUser } = useAuth();
  return (
    <Link to={activeUser ? "/home" : "/choose-school"} className="btn btn-gost">
      登入
    </Link>
  );
};

export default LoginButton;
