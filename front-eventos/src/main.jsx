import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp, theme } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
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

// StyleProvider layer: los estilos de antd van a la capa CSS "antd" (ver el orden en index.css)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StyleProvider layer>
      <ConfigProvider theme={tema} locale={esES}>
        <AntApp>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  </StrictMode>
);
