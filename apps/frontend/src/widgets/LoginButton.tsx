import { Link } from "react-router-dom";

const LoginButton = () => {
  return (
    <Link to="/choose-school" className="btn btn-gost">
      登入
    </Link>
  );
};

export default LoginButton;
