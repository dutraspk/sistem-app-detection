"""
Servidor YOLO local para o EPI Guard.
Roda no PC/notebook e recebe frames do navegador via POST /detect.

Endpoints:
  GET  /health       -> verifica se a IA está online
  POST /detect       -> recebe imagem JPEG (campo 'file'), retorna imagem
                        processada com as detecções desenhadas + cabeçalhos:
                        X-Detections: <lista de EPIs detectados>
                        X-Missing:    <lista de EPIs faltando>

Como usar:
  1. Copie este arquivo para a pasta do seu modelo treinado
     (ex: C:\Windows\System32\EpiDetection)
  2. Instale as dependências:
     pip install fastapi uvicorn ultralytics opencv-python python-multipart
  3. Execute:
     uvicorn server:app --host 0.0.0.0 --port 8000
  4. No app EPI Guard, em "Câmeras IA", ligue "Fiscalização por IA".
"""

import os
import glob
from pathlib import Path
from typing import Set, List

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(title="EPI Guard - YOLO Local")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Detections", "X-Missing"],
)

# ============================================================================
# CONFIGURAÇÕES - ajuste conforme o seu modelo
# ============================================================================
PASTA_MODELO = Path(__file__).parent  # pasta onde server.py está

# Lista de EPIs obrigatórios (minúsculas, sem acento). Ajuste conforme seu treinamento.
OBRIGATORIOS: Set[str] = {"capacete", "oculos", "luva", "bota", "colete", "mascara", "protetor"}

# Confiança mínima para considerar uma detecção válida
CONF_MIN = 0.5

# Nome da classe que representa a pessoa (para só exigir EPI quando houver alguém)
CLASSE_PESSOA = "pessoa"

# Cor das caixas (BGR)
COR_DETECCAO = (0, 255, 0)      # verde
COR_FALTANDO = (0, 0, 255)      # vermelho

# ============================================================================
# CARREGAMENTO DO MODELO
# Tenta Ultralytics primeiro; se não achar, cai no YOLOv4 darknet do OpenCV.
# ============================================================================
modelo = None
classes: List[str] = []
modelo_tipo: str = "nenhum"


def _procurar_arquivos(ext: str) -> List[Path]:
    return sorted(PASTA_MODELO.glob(f"**/*{ext}"))


def _carregar_classes() -> List[str]:
    for nome in ["obj.names", "classes.txt", "classes.names"]:
        caminho = PASTA_MODELO / nome
        if caminho.exists():
            return caminho.read_text(encoding="utf-8").strip().splitlines()
    return []


def _carregar_ultralytics() -> bool:
    global modelo, classes, modelo_tipo
    pts = _procurar_arquivos(".pt")
    if not pts:
        return False
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[AVISO] Arquivo .pt encontrado, mas 'ultralytics' não está instalado.")
        print("        Instale: pip install ultralytics")
        return False

    caminho = pts[0]
    print(f"[INFO] Carregando modelo Ultralytics: {caminho}")
    modelo = YOLO(str(caminho))
    classes = list(modelo.names.values()) if hasattr(modelo, "names") else _carregar_classes()
    modelo_tipo = "ultralytics"
    print(f"[INFO] Classes: {classes}")
    return True


def _carregar_darknet() -> bool:
    global modelo, classes, modelo_tipo
    weights = _procurar_arquivos(".weights")
    cfgs = _procurar_arquivos(".cfg")
    if not weights or not cfgs:
        return False

    caminho_weights = weights[0]
    caminho_cfg = cfgs[0]
    print(f"[INFO] Carregando modelo Darknet: {caminho_weights} + {caminho_cfg}")

    net = cv2.dnn.readNet(str(caminho_weights), str(caminho_cfg))
    detection_model = cv2.dnn_DetectionModel(net)
    detection_model.setInputParams(size=(416, 416), scale=1 / 255, swapRB=True)

    classes = _carregar_classes()
    modelo = detection_model
    modelo_tipo = "darknet"
    print(f"[INFO] Classes: {classes}")
    return True


if not _carregar_ultralytics():
    if not _carregar_darknet():
        print("=" * 70)
        print("[ERRO] Nenhum modelo encontrado na pasta:", PASTA_MODELO)
        print("       Coloque aqui um dos conjuntos:")
        print("         - modelo .pt (YOLOv5/v8/v11) + opcional classes.txt")
        print("         - .weights + .cfg + obj.names (YOLOv4)")
        print("=" * 70)
    else:
        print("[INFO] Modelo Darknet carregado com sucesso.")
else:
    print("[INFO] Modelo Ultralytics carregado com sucesso.")


# ============================================================================
# FUNÇÕES DE INFERÊNCIA
# ============================================================================
def _normalizar_nome(nome: str) -> str:
    """Remove acentos e converte para minúsculas para comparar com OBRIGATORIOS."""
    nome = nome.lower().strip()
    for char, repl in [("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"),
                       ("ã", "a"), ("õ", "o"), ("ç", "c"), ("ê", "e"), ("ô", "o")]:
        nome = nome.replace(char, repl)
    return nome


def _detectar_ultralytics(frame: np.ndarray):
    resultados = modelo(frame, verbose=False)[0]
    nomes_detectados: Set[str] = set()
    boxes = []
    confs = []
    cls_ids = []

    for box in resultados.boxes:
        conf = float(box.conf[0])
        if conf < CONF_MIN:
            continue
        cls_id = int(box.cls[0])
        nome = classes[cls_id] if 0 <= cls_id < len(classes) else str(cls_id)
        nome_norm = _normalizar_nome(nome)
        nomes_detectados.add(nome_norm)
        boxes.append(box.xyxy[0].cpu().numpy().astype(int))
        confs.append(conf)
        cls_ids.append(cls_id)

    # Desenha caixas
    out = frame.copy()
    for (x1, y1, x2, y2), conf, cls_id in zip(boxes, confs, cls_ids):
        nome = classes[cls_id] if 0 <= cls_id < len(classes) else str(cls_id)
        nome_norm = _normalizar_nome(nome)
        cor = COR_FALTANDO if nome_norm in OBRIGATORIOS and nome_norm not in nomes_detectados else COR_DETECCAO
        cv2.rectangle(out, (x1, y1), (x2, y2), cor, 2)
        label = f"{nome} {conf:.2f}"
        cv2.putText(out, label, (x1, max(y1 - 10, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor, 2)

    return out, nomes_detectados


def _detectar_darknet(frame: np.ndarray):
    ids, scores, boxes = modelo.detect(frame, CONF_MIN, 0.4)
    nomes_detectados: Set[str] = set()

    out = frame.copy()
    if ids is not None and len(ids) > 0:
        for cls_id, score, box in zip(ids.flatten(), scores.flatten(), boxes):
            nome = classes[int(cls_id)] if 0 <= int(cls_id) < len(classes) else str(int(cls_id))
            nome_norm = _normalizar_nome(nome)
            nomes_detectados.add(nome_norm)
            x, y, w, h = box.astype(int)
            cor = COR_DETECCAO
            cv2.rectangle(out, (x, y), (x + w, y + h), cor, 2)
            label = f"{nome} {float(score):.2f}"
            cv2.putText(out, label, (x, max(y - 10, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor, 2)

    return out, nomes_detectados


def _processar(frame: np.ndarray):
    if modelo_tipo == "ultralytics":
        return _detectar_ultralytics(frame)
    if modelo_tipo == "darknet":
        return _detectar_darknet(frame)
    return frame.copy(), set()


# ============================================================================
# ENDPOINTS
# ============================================================================
@app.get("/health")
def health():
    return {
        "ok": modelo is not None,
        "modelo": modelo_tipo,
        "classes": classes,
        "obrigatorios": sorted(OBRIGATORIOS),
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if modelo is None:
        return Response(
            content=b"Modelo nao carregado",
            media_type="text/plain",
            status_code=503,
            headers={"X-Detections": "", "X-Missing": ""},
        )

    try:
        buf = np.frombuffer(await file.read(), np.uint8)
        frame = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if frame is None:
            return Response(
                content=b"Imagem invalida",
                media_type="text/plain",
                status_code=400,
                headers={"X-Detections": "", "X-Missing": ""},
            )

        out, detectados = _processar(frame)

        # Só exige EPI se houver uma pessoa no frame
        if CLASSE_PESSOA in detectados:
            faltando = sorted(OBRIGATORIOS - detectados)
        else:
            faltando = []

        _, jpg = cv2.imencode(".jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 75])

        return Response(
            content=jpg.tobytes(),
            media_type="image/jpeg",
            headers={
                "X-Detections": ",".join(sorted(detectados)),
                "X-Missing": ",".join(faltando),
            },
        )
    except Exception as e:
        return Response(
            content=f"Erro: {e}".encode(),
            media_type="text/plain",
            status_code=500,
            headers={"X-Detections": "", "X-Missing": ""},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
