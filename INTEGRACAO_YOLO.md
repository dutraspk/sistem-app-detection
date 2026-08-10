# Integrando sua YOLO (EpiDetection) ao EPI Guard

Repositório do modelo: https://github.com/dutraspk/EpiDetection

A IA **não roda dentro do app** — ela roda no seu PC/servidor lendo as câmeras e
envia os eventos (com a foto do frame) para o painel via HTTPS.

```text
Câmera RTSP → PC/servidor (Python + YOLO)
   → detecta pessoa + EPIs
   → POST /api/public/eventos  (JSON + frame em base64)
   → painel "Detecções IA" atualiza em tempo real
```

## 1. Endpoint

`POST https://SEU-APP.lovable.app/api/public/eventos`

Header obrigatório: `x-api-key: <EPI_INGEST_KEY>`

Corpo (JSON):

| Campo | Tipo | Obrigatório |
|---|---|---|
| `camera` | string | sim |
| `setor` | string | não |
| `trabalhador` | string | não |
| `validacao` | `"Liberado"` \| `"Bloqueado"` | não (calculado por `epis_faltando`) |
| `epis_detectados` | string[] | não |
| `epis_faltando` | string[] | não |
| `confianca` | número 0–1 | não |
| `ocorreu_em` | ISO 8601 | não |
| `frame_base64` | JPEG em base64 | não |

Resposta: `201 { "ok": true, "id": "...", "frame_url": "..." }`

## 2. detector.py (rodar no PC/servidor)

```python
import base64, time
import cv2, requests
from datetime import datetime, timezone

API   = "https://SEU-APP.lovable.app/api/public/eventos"
TOKEN = "COLE_AQUI_A_EPI_INGEST_KEY"

CAMERA = "CAM-01"
SETOR  = "Forno A"
RTSP   = "rtsp://usuario:senha@192.168.0.50:554/stream1"   # ou 0 para webcam USB

OBRIGATORIOS = {"capacete", "oculos", "luva", "bota", "colete"}
CONF_MIN     = 0.5
INTERVALO    = 3            # segundos entre envios (anti-spam)

net = cv2.dnn.readNet("yolov4-epi.weights", "yolov4-epi.cfg")
classes = open("obj.names").read().strip().splitlines()
model = cv2.dnn_DetectionModel(net)
model.setInputParams(size=(416, 416), scale=1 / 255, swapRB=True)

cap = cv2.VideoCapture(RTSP)
ultimo = 0

while True:
    ok, frame = cap.read()
    if not ok:
        time.sleep(1)
        cap = cv2.VideoCapture(RTSP)
        continue

    ids, scores, boxes = model.detect(frame, CONF_MIN, 0.4)
    detectados = {classes[int(i)] for i in ids}
    if "pessoa" not in detectados:
        continue
    if time.time() - ultimo < INTERVALO:
        continue
    ultimo = time.time()

    faltando = sorted(OBRIGATORIOS - detectados)
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])

    try:
        r = requests.post(API, timeout=10,
            headers={"x-api-key": TOKEN},
            json={
                "camera": CAMERA,
                "setor": SETOR,
                "validacao": "Bloqueado" if faltando else "Liberado",
                "epis_detectados": sorted(detectados - {"pessoa"}),
                "epis_faltando": faltando,
                "confianca": float(max(scores)) if len(scores) else 0.0,
                "ocorreu_em": datetime.now(timezone.utc).isoformat(),
                "frame_base64": base64.b64encode(buf).decode(),
            })
        print(r.status_code, r.text[:200])
    except Exception as e:
        print("falha ao enviar:", e)
```

Instalar dependências:

```bash
pip install opencv-python requests
python detector.py
```

## 3. Rodar sempre (Windows)

Crie um `.bat` e coloque em `shell:startup`:

```bat
@echo off
cd /d C:\EpiDetection
python detector.py
```

No Linux, use um serviço systemd (`/etc/systemd/system/epi-detector.service`) com
`Restart=always`.

## 4. Dicas de desempenho

- Várias câmeras: rode uma thread/processo por câmera, cada uma com seu `CAMERA`.
- CPU fraca: use **YOLOv4-tiny** e reduza para `size=(320, 320)`.
- GPU NVIDIA: compile o OpenCV com CUDA e adicione
  `net.setPreferableBackend(cv2.dnn.DNN_BACKEND_CUDA)` +
  `net.setPreferableTarget(cv2.dnn.DNN_TARGET_CUDA)`.
- Não envie todo frame: só quando houver pessoa e respeitando o `INTERVALO`.

## 5. Teste rápido sem a IA

```bash
curl -X POST https://SEU-APP.lovable.app/api/public/eventos \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{"camera":"CAM-01","setor":"Forno A","epis_faltando":["capacete"],"confianca":0.91}'
```

O evento deve aparecer na página **Detecções IA** na hora.
