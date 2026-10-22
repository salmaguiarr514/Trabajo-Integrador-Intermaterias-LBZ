import { App as AntApp, ConfigProvider, theme } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import esES from "antd/locale/es_ES";
import { PANEL } from "../tema.js";

// Tema de antd: oscuro con acento violeta. El violeta de relleno lleva texto blanco; links y textos usan el claro.
const temaAntd = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: PANEL.violeta,
    colorLink: PANEL.violetaTexto,
    colorLinkHover: PANEL.violetaTextoHover,
    colorLinkActive: PANEL.violetaTexto,
    colorPrimaryText: PANEL.violetaTexto,
    colorPrimaryTextHover: PANEL.violetaTextoHover,
    colorPrimaryTextActive: PANEL.violetaTexto,
    colorBgLayout: PANEL.fondo,
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  components: {
    Menu: { itemSelectedColor: PANEL.violetaTextoHover }
  }
};

// antd (tema violeta, en español) solo en los paneles: el sitio público no lo descarga.
// StyleProvider layer: los estilos de antd van a la capa CSS "antd" (ver el orden en index.css).
function ProveedorAntd({ children }) {
  return (
    <StyleProvider layer>
      <ConfigProvider theme={temaAntd} locale={esES}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default ProveedorAntd;
