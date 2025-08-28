import "./App.css";
import { Route, Routes } from "react-router-dom";
import Root from "./pages/Root";
import Navbar from "./widgets/Navbar";
import Intro from "./pages/Intro";
import { useEffect } from "react";
import ChooseSchool from "./pages/ChooseSchool";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginFailed from "./pages/LoginFailed";
import QrScannerRef from "./pages/QRCodeScanner";
import Schools from "./pages/Schools";

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const isDarkMode =
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Root />} />
        <Route path="intro" element={<Intro />} />
        <Route path="choose-school" element={<ChooseSchool />} />
        <Route path="login/:method" element={<Login />} />
        <Route path="login-failed" element={<LoginFailed />} />
        <Route path="qr-scanner" element={<QrScannerRef />} />
        <Route path="schools" element={<Schools />} />
        <Route
          path="home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
