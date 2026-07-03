import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AdminPanel from "./AdminPanel";

const isAdmin = window.location.pathname === "/admin" || window.location.hash === "#admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdmin ? <AdminPanel /> : <App />}
  </StrictMode>
);
