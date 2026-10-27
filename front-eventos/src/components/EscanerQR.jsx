import { useEffect, useRef, useState } from "react";
import { Alert, Typography } from "antd";

// Lector de QR con la cámara (control de acceso). Usa qr-scanner, que se descarga recién al abrir la cámara:
// si el navegador trae un detector de códigos lo usa; si no, decodifica en un worker sin trabar la pantalla.
// La cámara necesita HTTPS (en Vercel lo hay) o localhost.
//   <EscanerQR onLeer={(texto) => validar(texto)} />
// Un mismo QR no se vuelve a mandar hasta pasados unos segundos (si queda frente a la cámara).
const ESPERA_MISMO_QR = 4000;

function EscanerQR({ onLeer }) {
  const video = useRef(null);
  const alLeer = useRef(onLeer);
  const ultimo = useRef({ texto: "", cuando: 0 });
  const [estado, setEstado] = useState({ listo: false, error: "" });

  useEffect(() => {
    alLeer.current = onLeer;
  }, [onLeer]);

  useEffect(() => {
    let escaner = null;
    let cancelado = false;
    import("qr-scanner")
      .then(async ({ default: QrScanner }) => {
        if (cancelado) return;
        if (!(await QrScanner.hasCamera())) {
          setEstado({ listo: false, error: "Este dispositivo no tiene cámara. Usá un lector de QR o escribí el código." });
          return;
        }
        escaner = new QrScanner(
          video.current,
          ({ data }) => {
            const ahora = Date.now();
            if (data === ultimo.current.texto && ahora - ultimo.current.cuando < ESPERA_MISMO_QR) return;
            ultimo.current = { texto: data, cuando: ahora };
            alLeer.current(data);
          },
          { preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: true, maxScansPerSecond: 8, returnDetailedScanResult: true }
        );
        await escaner.start();
        if (cancelado) escaner.destroy();
        else setEstado({ listo: true, error: "" });
      })
      .catch((error) => {
        if (cancelado) return;
        const permiso = /NotAllowed|Permission|denied/i.test(String(error?.name ?? error));
        setEstado({
          listo: false,
          error: permiso
            ? "No tenemos permiso para usar la cámara: habilitalo en el navegador (el ícono al lado de la dirección) o usá un lector de QR."
            : "No pudimos abrir la cámara. Probá de nuevo, o usá un lector de QR o el código."
        });
      });
    return () => {
      cancelado = true;
      escaner?.destroy();
    };
  }, []);

  return (
    <div className="escaner-qr">
      {estado.error ? (
        <Alert type="warning" showIcon title={estado.error} />
      ) : (
        <>
          <div className="escaner-qr-visor">
            <video ref={video} muted playsInline aria-label="Vista de la cámara para leer el QR de la entrada" />
          </div>
          <Typography.Text type="secondary" role="status">
            {estado.listo ? "Apuntá la cámara al QR: se valida solo." : "Abriendo la cámara…"}
          </Typography.Text>
        </>
      )}
    </div>
  );
}

export default EscanerQR;
