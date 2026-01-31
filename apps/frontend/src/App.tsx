import "./App.css";
import { lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Root from "./pages/Root";
import ProtectedGate from "./auth/ProtectedGate";
import FilteredShops from "./pages/CategorizedShops";
import UserAccountCenter from "./pages/AccounCenter";
const ShopsMap = lazy(() => import("./pages/ShopsMap"));
const SchoolDetail = lazy(() => import("./pages/SchoolDetail"));
const Navbar = lazy(() => import("./widgets/Navbar"));
const LoginHint = lazy(() => import("./pages/LoginHint"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const QrVerification = lazy(() => import("./pages/QRVerification"));
const ShopPreview = lazy(() => import("./pages/ShopRegisterForm/ShopPreview"));
const Intro = lazy(() => import("./pages/Intro"));
const ChooseSchool = lazy(() => import("./pages/ChooseSchool"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const LoginFailed = lazy(() => import("./pages/LoginFailed"));
const QrScannerRef = lazy(() => import("./pages/QRCodeScanner"));
const Schools = lazy(() => import("./pages/Schools"));
const Shops = lazy(() => import("./pages/Shops"));
const ShopDetail = lazy(() => import("./pages/ShopDetail"));
const ShopRegisterForm = lazy(
  () => import("./pages/ShopRegisterForm/ShopRegisterForm")
);
const ShopDrafts = lazy(() => import("./pages/ShopDrafts"));

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
        <Route path="login-hint" element={<LoginHint />} />
        <Route path="qr-scanner" element={<QrScannerRef />} />
        <Route path="qr-verification" element={<QrVerification />} />
      </Route>

      <Route element={<ProtectedGate />}>
        <Route path="home" element={<Home />} />
      </Route>

      <Route path="schools" element={<Schools />} />

      <Route path="schools/:abbr" element={<SchoolDetail />} />

      <Route path="faq" element={<FAQPage />} />

      <Route element={<ProtectedGate />}>
        <Route path="account-center" element={<UserAccountCenter />} />
      </Route>

      <Route path="shops/map" element={<ShopsMap />} />

      <Route path="shops/preview" element={<ShopPreview />} />

      <Route path="shops/register" element={<ShopRegisterForm />} />

      <Route path="shops/drafts" element={<ShopDrafts />} />
      <Route path="shops" element={<Shops />} />
      <Route path="shops/filtered/:filter" element={<FilteredShops />} />
      <Route path="shops/:id" element={<ShopDetail />} />
    </Routes>
  );
}

export default App;
