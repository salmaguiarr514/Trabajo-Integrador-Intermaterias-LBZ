import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp, theme } from "antd";
import esES from "antd/locale/es_ES";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";

// Tema oscuro con acento violeta (estética de recitales / escenario)
const tema = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#a855f7",
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif"
  }
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider theme={tema} locale={esES}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>
);
