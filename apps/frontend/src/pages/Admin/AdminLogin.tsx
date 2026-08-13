import { useState } from "react";
import Logo from "../../widgets/Logo";
import { useToast } from "../../widgets/Toast/ToastProvider";
import { KeyRound, MailQuestionMark } from "lucide-react";
import { path } from "../../utils/path";
import { getDeviceId } from "../../utils/device";
import { useAdminAuth } from "../../auth/admin-auth/AdminAuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "../../widgets/ModalContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const [showHint, setShowHint] = useState(false);
  const { login } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleLogin = async () => {
    if (!email) {
      showToast({
        title: "Missing email",
        icon: <MailQuestionMark className="text-info" />,
        replace: true,
      });
      return;
    }

    if (!password) {
      showToast({
        title: "Missing password",
        icon: <KeyRound className="text-info" />,
        replace: true,
      });
      return;
    }

    if (!email.includes("@")) {
      showToast({
        title: "Invalid email format",
        icon: <MailQuestionMark className="text-error" />,
        replace: true,
      });
      return;
    }

    if (password.length < 8) {
      setShowHint(true);
      return;
    } else {
      setShowHint(false);
    }

    await a();
  };

  const a = async () => {
    const url = path("/api/auth/admin/login");
    const body = {
      email,
      password,
    };

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": getDeviceId(),
      },
      body: JSON.stringify(body),
    });

    try {
      const resJson = await res.json();
      const { success, error } = resJson;
      if (!success) {
        throw new Error(error.code);
      }
      await login(resJson);
      const to = searchParams.get("to");
      navigate(to && to !== "null" ? to : "/admin", { replace: true });
    } catch (e: any) {
      showModal({
        title: "Failed to login",
        description: e.message ?? "UNKNOWN_ERROR",
        showDismissButton: true,
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-base-100 flex flex-col items-center justify-center">
      <Logo className="h-10 w-auto" />
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Login</legend>

        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(" ", "").trim())}
          placeholder="Password"
        />
        {showHint && (
          <p className="text-error">Password must be at least 8 characters</p>
        )}

        <button onClick={handleLogin} className="btn btn-neutral mt-4">
          Login
        </button>
      </fieldset>
    </div>
  );
};

export default AdminLogin;
