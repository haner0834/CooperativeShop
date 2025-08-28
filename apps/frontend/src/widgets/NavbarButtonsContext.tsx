import { createContext, useContext, useState, type ReactNode } from "react";
import { type NavbarButton, type NavbarButtonType } from "./Navbar";
import BackButton from "./BackButton";
import HomeButton from "./HomeButton";
import LoginButton from "./LoginButton";
import ThemeToggle from "./ThemeToggle";
import RegisterButton from "./RegisterButton";
import NavbarLogo from "./NavbarLogo";

type NavbarButtonsContextType = {
  navbarButtons: NavbarButton[];
  setNavbarButtons: (buttons: NavbarButton[]) => void;
  appendDefaultNavbarButton: (type: NavbarButtonType) => void;
  setNavbarButtonsByType: (types: NavbarButtonType[]) => void;
  appendNavbarButton: (button: NavbarButton) => void;
  navbarTitle?: string;
  setNavbarTitle: (title: string | undefined) => void;
};

const NavbarButtonsContext = createContext<
  NavbarButtonsContextType | undefined
>(undefined);

export const useNavbarButtons = () => {
  const context = useContext(NavbarButtonsContext);
  if (!context) {
    throw new Error(
      "useNavbarButtons must be used within a NavbarButtonsProvider"
    );
  }
  return context;
};

export const NavbarButtonTypeMap = new Map<NavbarButtonType, NavbarButton>([
  // -- start
  [
    "logo",
    {
      placement: "start",
      id: "navbar_logo",
      order: 0,
      content: <NavbarLogo />,
    },
  ],
  [
    "back",
    {
      placement: "start",
      id: "navbar_back",
      order: -1,
      content: <BackButton />,
    },
  ],

  // -- center --

  // -- end --
  [
    "themeToggle",
    {
      placement: "end",
      id: "navbar_theme_toggle",
      order: 0,
      content: <ThemeToggle />,
    },
  ],
  [
    "register",
    {
      placement: "end",
      id: "navbar_register",
      order: 1,
      content: <RegisterButton />,
    },
  ],
  [
    "login",
    {
      placement: "end",
      id: "navbar_login",
      order: 2,
      content: <LoginButton />,
    },
  ],
  [
    "home",
    {
      placement: "end",
      id: "navbar_home",
      order: 0,
      content: <HomeButton />,
    },
  ],
]);

type NavbarButtonsProviderProps = {
  children: ReactNode;
};

export const NavbarButtonsProvider = ({
  children,
}: NavbarButtonsProviderProps) => {
  const [navbarButtons, setNavbarButtons] = useState<NavbarButton[]>([]);
  const [navbarTitle, setNavbarTitle] = useState<string | undefined>(undefined);

  const appendDefaultNavbarButton = (type: NavbarButtonType) => {
    const button = NavbarButtonTypeMap.get(type);
    if (button) {
      setNavbarButtons([...navbarButtons, button]);
    }
  };

  const setNavbarButtonsByType = (types: NavbarButtonType[]) => {
    const buttons = types
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter((button) => !!button);
    setNavbarButtons(buttons);
  };

  const appendNavbarButton = (button: NavbarButton) => {
    setNavbarButtons([...navbarButtons, button]);
  };

  return (
    <NavbarButtonsContext.Provider
      value={{
        navbarButtons,
        setNavbarButtons,
        appendDefaultNavbarButton,
        setNavbarButtonsByType,
        appendNavbarButton,
        navbarTitle,
        setNavbarTitle,
      }}
    >
      {children}
    </NavbarButtonsContext.Provider>
  );
};
