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
    colorTextPlaceholder: "rgba(255, 255, 255, 0.55)", // 5,7:1 (el de antd queda en 2,2:1)
    colorError: "#ff7875", // texto rojo 7,2:1 sobre las tarjetas
    colorPrimaryBorder: PANEL.violetaTexto, // anillo de foco de botones y switches (7:1; el derivado no llegaba a 3:1)
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  components: {
    Menu: { itemSelectedColor: PANEL.violetaTextoHover },
    Tabs: { itemSelectedColor: PANEL.violetaTextoHover, itemHoverColor: PANEL.violetaTexto, itemActiveColor: PANEL.violetaTexto, inkBarColor: PANEL.violetaTexto },
    Button: { dangerColor: PANEL.fondo }, // texto oscuro sobre el rojo relleno (7,7:1; el blanco daba 2,6:1)
    // Borde de los campos con foco o al pasar el mouse: el violeta claro (el derivado quedaba en 2,8:1)
    Input: { activeBorderColor: PANEL.violetaTexto, hoverBorderColor: PANEL.violetaTexto },
    InputNumber: { activeBorderColor: PANEL.violetaTexto, hoverBorderColor: PANEL.violetaTexto },
    Select: { activeBorderColor: PANEL.violetaTexto, hoverBorderColor: PANEL.violetaTexto },
    DatePicker: { activeBorderColor: PANEL.violetaTexto, hoverBorderColor: PANEL.violetaTexto }
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
