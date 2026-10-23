import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";

// antd no se carga acá: su ConfigProvider está en los paneles, así el sitio público no lo descarga
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
