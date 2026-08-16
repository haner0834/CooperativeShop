import "reflect-metadata";
import "./App.css";
import { lazy, useEffect } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import Root from "./pages/Root";
import ProtectedGate from "./auth/ProtectedGate";
import { InteractionProvider } from "./contexts/InteractionProvider";
import { AdminAuthProvider } from "./auth/admin-auth/AdminAuthContext";
import { AuthProvider } from "./auth/AuthContext";
import AdminProtectedGate from "./auth/admin-auth/AdminProtectedGate";
import AdminLogin from "./pages/Admin/AdminLogin";
import { ModalProvider } from "./widgets/ModalContext";
import AdminOAuthCallbackSuccessPage from "./pages/Admin/AdminOAuthCallback";
import AdminOAuthCallbackFailedPage from "./pages/Admin/AdminLoginFailed";
const AdminMembersConsole = lazy(
  () => import("./pages/Admin/AdminMembersConsole")
);
const AdminInviteAcceptPage = lazy(
  () => import("./pages/Admin/AdminInviteAccept")
);
const DraftReviewList = lazy(() => import("./pages/Admin/DraftReviewList"));
const DraftReview = lazy(() => import("./pages/Admin/DraftReview/DraftReview"));
const FilteredShops = lazy(() => import("./pages/CategorizedShops"));
const UserAccountCenter = lazy(() => import("./pages/AccounCenter"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
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

function StudentAuthLayout() {
  return (
    <AuthProvider>
      <ModalProvider>
        <InteractionProvider>
          <Outlet />
        </InteractionProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

// AdminAuthLayout.tsx
function AdminAuthLayout() {
  return (
    <AdminAuthProvider>
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    </AdminAuthProvider>
  );
}

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
      <Route element={<StudentAuthLayout />}>
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
      </Route>

      <Route path="/admin" element={<AdminAuthLayout />}>
        <Route path="login" element={<AdminLogin />} />
        <Route path="invite/:token" element={<AdminInviteAcceptPage />} />
        <Route
          path="oauth-callback"
          element={<AdminOAuthCallbackSuccessPage />}
        />
        <Route path="login-failed" element={<AdminOAuthCallbackFailedPage />} />

        <Route element={<AdminProtectedGate />}>
          <Route path="draft-review-list" element={<DraftReviewList />} />
          <Route path="auth-console" element={<AdminMembersConsole />} />
          <Route index element={<AdminDashboard />} />
          <Route path="draft-review/:id" element={<DraftReview />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
