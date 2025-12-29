import "./libs/http-interceptor";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { NavbarButtonsProvider } from "./widgets/NavbarButtonsContext.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { DeviceProvider } from "./widgets/DeviceContext.tsx";
import { ModalProvider } from "./widgets/ModalContext.tsx";
import { ToastProvider } from "./widgets/Toast/ToastProvider.tsx";
import { PathHistoryProvider } from "./contexts/PathHistoryContext.tsx";
import { InteractionProvider } from "./contexts/InteractionProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PathHistoryProvider fallback="/">
          <DeviceProvider>
            <ModalProvider>
              <NavbarButtonsProvider>
                <ToastProvider defaultOptions={{ maxStack: 5 }}>
                  <InteractionProvider>
                    <App />
                  </InteractionProvider>
                </ToastProvider>
              </NavbarButtonsProvider>
            </ModalProvider>
          </DeviceProvider>
        </PathHistoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
