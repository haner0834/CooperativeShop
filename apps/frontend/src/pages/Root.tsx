import { useState } from "react";
import { Navigate } from "react-router-dom";
import { isPwa } from "../utils/isPwa";

const Root = () => {
  const [isLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn");
  });
  const [lastOpen] = useState(() => {
    if (isPwa()) return localStorage.getItem("lastOpen");
    return null;
  });

  if (isLoggedIn) {
    return <Navigate to={lastOpen ?? "/home"} replace />;
  } else {
    return <Navigate to="/intro" replace />;
  }
};

export default Root;
