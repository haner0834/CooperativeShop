import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import LogoCircle from "@shared/app-icons/logo-circle.png";
import { useNavigate } from "react-router-dom";

const NavbarLogo = () => {
  const navigate = useNavigate();
  const toRoot = () => navigate("/");
  return (
    <div onClick={toRoot} className="flex justify-center cursor-pointer">
      <Logo className="h-10 w-auto hidden md:block" />
      <img src={LogoCircle} className="h-10 w-auto md:hidden" />
    </div>
  );
};

export default NavbarLogo;
