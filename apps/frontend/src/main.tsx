import "./libs/http-interceptor";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { NavbarButtonsProvider } from "./widgets/NavbarButtonsContext.tsx";
import { DeviceProvider } from "./widgets/DeviceContext.tsx";
import { ToastProvider } from "./widgets/Toast/ToastProvider.tsx";
import { PathHistoryProvider } from "./contexts/PathHistoryContext.tsx";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import queryString from "query-string";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryParamProvider
        adapter={ReactRouter6Adapter}
        options={{
          searchStringToObject: queryString.parse,
          objectToSearchString: queryString.stringify,
        }}
      >
        <PathHistoryProvider fallback="/">
          <DeviceProvider>
            <NavbarButtonsProvider>
              <ToastProvider defaultOptions={{ maxStack: 5 }}>
                <App />
              </ToastProvider>
            </NavbarButtonsProvider>
          </DeviceProvider>
        </PathHistoryProvider>
      </QueryParamProvider>
    </BrowserRouter>
  </StrictMode>
);
