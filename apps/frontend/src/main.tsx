import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { NavbarButtonsProvider } from "./widgets/NavbarButtonsContext.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { DeviceProvider } from "./widgets/DeviceContext.tsx";
import { ModalProvider } from "./widgets/ModalContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <ModalProvider>
            <NavbarButtonsProvider>
              <App />
            </NavbarButtonsProvider>
          </ModalProvider>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
