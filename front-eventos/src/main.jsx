import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import esES from "antd/locale/es_ES";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { temaAntd } from "./tema.js";

// StyleProvider layer: los estilos de antd van a la capa CSS "antd" (ver el orden en index.css)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StyleProvider layer>
      <ConfigProvider theme={temaAntd} locale={esES}>
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
