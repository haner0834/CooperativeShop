import "./App.css";
import { lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Root from "./pages/Root";
import Navbar from "./widgets/Navbar";
const Intro = lazy(() => import("./pages/Intro"));
const ChooseSchool = lazy(() => import("./pages/ChooseSchool"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const ProtectedRoute = lazy(() => import("./auth/ProtectedRoute"));
const LoginFailed = lazy(() => import("./pages/LoginFailed"));
const QrScannerRef = lazy(() => import("./pages/QRCodeScanner"));
const Schools = lazy(() => import("./pages/Schools"));
const Shops = lazy(() => import("./pages/Shops"));
const ShopDetail = lazy(() => import("./pages/ShopDetail"));
import ShopRegisterForm from "./pages/ShopRegisterForm";

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

      <Route path="shops/register" element={<ShopRegisterForm />} />
      <Route path="shops" element={<Shops />} />
      <Route path="shops/:id" element={<ShopDetail />} />
    </Routes>
  );
}

export default App;
