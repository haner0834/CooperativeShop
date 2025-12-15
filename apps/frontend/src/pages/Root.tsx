import { useState } from "react";
import { Navigate } from "react-router-dom";

const Root = () => {
  const [isLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn");
  });

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/intro" replace />;
  }
};

export default Root;
