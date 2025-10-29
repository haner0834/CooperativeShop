import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import { useNavigate } from "react-router-dom";

const NavbarLogo = () => {
  const navigate = useNavigate();
  const toRoot = () => navigate("/");
  return (
    <div onClick={toRoot} className="flex justify-center cursor-pointer">
      <Logo className="h-10 w-auto" />
    </div>
  );
};

export default NavbarLogo;
