"""Hook SessionStart: inyecta al inicio de cada sesión el contexto de engram y graphify.

Todo lo que se imprime por stdout entra al contexto de Claude.
"""
import gzip
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
MAX_CONTENIDO = 700


def memorias_engram():
    carpeta = RAIZ / ".engram" / "chunks"
    if not carpeta.is_dir():
        return "No hay memorias de engram en .engram/chunks."
    # Una memoria por topic_key: se queda la revisión más reciente.
    por_tema = {}
    for chunk in sorted(carpeta.glob("*.jsonl.gz")):
        with gzip.open(chunk, "rt", encoding="utf-8") as f:
            for linea in f:
                if not linea.strip():
                    continue
                datos = json.loads(linea)
                for obs in datos.get("observations", []):
                    clave = obs.get("topic_key") or obs.get("sync_id")
                    previa = por_tema.get(clave)
                    if not previa or obs.get("updated_at", "") > previa.get("updated_at", ""):
                        por_tema[clave] = obs
    if not por_tema:
        return "Las memorias de engram están vacías."
    partes = []
    for obs in sorted(por_tema.values(), key=lambda o: o.get("updated_at", ""), reverse=True):
        contenido = (obs.get("content") or "").strip()
        if len(contenido) > MAX_CONTENIDO:
            contenido = contenido[:MAX_CONTENIDO] + " […]"
        partes.append(f"### [{obs.get('type')}] {obs.get('title')} ({obs.get('updated_at', '')[:10]})\n{contenido}")
    return "\n\n".join(partes)


def seccion(reporte, titulo):
    lineas = reporte.splitlines()
    try:
        inicio = next(i for i, l in enumerate(lineas) if l.strip() == f"## {titulo}")
    except StopIteration:
        return ""
    fin = next((i for i in range(inicio + 1, len(lineas)) if lineas[i].startswith("## ")), len(lineas))
    return "\n".join(lineas[inicio:fin]).strip()


def resumen_graphify():
    reporte_path = RAIZ / "graphify-out" / "GRAPH_REPORT.md"
    if not reporte_path.is_file():
        return "No hay grafo de graphify todavía (falta graphify-out/GRAPH_REPORT.md). Se arma con /graphify."
    reporte = reporte_path.read_text(encoding="utf-8")
    partes = [seccion(reporte, t) for t in ("Summary", "Community Hubs (Navigation)", "God Nodes (most connected - your core abstractions)")]

    # Avisa si hubo commits después de la última construcción del grafo.
    grafo = RAIZ / "graphify-out" / "graph.json"
    try:
        ultimo_commit = int(subprocess.run(
            ["git", "log", "-1", "--format=%ct"], cwd=RAIZ, capture_output=True, text=True, timeout=10
        ).stdout.strip())
        if grafo.is_file() and grafo.stat().st_mtime < ultimo_commit:
            fecha = datetime.fromtimestamp(grafo.stat().st_mtime).strftime("%Y-%m-%d %H:%M")
            partes.append(f"AVISO: el grafo es del {fecha} y hay commits posteriores. Sugerile al usuario `/graphify . --update`.")
    except (ValueError, OSError, subprocess.SubprocessError):
        pass
    return "\n\n".join(p for p in partes if p)


def main():
    salida = [
        "# Contexto de inicio de sesión (hook SessionStart)",
        "",
        "## Memorias de engram del grupo (.engram/)",
        "Son de sesiones anteriores y pueden estar desactualizadas: verificá contra el código y los docs antes de afirmar algo.",
        "",
        memorias_engram(),
        "",
        "## Grafo de graphify (graphify-out/)",
        "Para preguntas sobre la arquitectura o cómo se conectan las partes, consultá primero el grafo con "
        "`/graphify query \"<pregunta>\"` antes de leer archivos uno por uno. "
        "El grafo excluye engram-main/.",
        "",
        resumen_graphify(),
    ]
    sys.stdout.reconfigure(encoding="utf-8")
    print("\n".join(salida))


if __name__ == "__main__":
    main()
