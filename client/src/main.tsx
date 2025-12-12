// src/main.tsx
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Auth1Provider } from "./context/Context.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <Auth1Provider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth1Provider>
  </AuthProvider>
);
