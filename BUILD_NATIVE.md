# EPI Guard — Build APK Android + Executável Windows

Este projeto roda como **Web / PWA / APK / .exe** a partir da mesma base de código.
Como o build final precisa de SDKs nativos, ele é feito **na sua máquina**, não no Lovable.

---

## 📋 Pré-requisitos

| O que | Para o quê | Onde baixar |
|---|---|---|
| **Node.js 20+** | Build do app | https://nodejs.org |
| **Android Studio** | Gerar APK | https://developer.android.com/studio |
| **JDK 17+** | Compilar Android | Já vem com Android Studio |
| **Git** | Clonar o projeto | https://git-scm.com |

> No Lovable, vá em **GitHub → Connect to GitHub**, clone o repo na sua máquina e siga abaixo.

---

## 🤖 1. Gerar APK Android (Capacitor)

```bash
# 1. Instalar dependências
npm install
npm install --save @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli

# 2. Build da versão web
npm run build

# 3. Inicializar Capacitor (só na 1ª vez)
npx cap add android

# 4. Sincronizar build → projeto Android
npx cap sync android

# 5. Abrir no Android Studio
npx cap open android
```

No **Android Studio**:
- Aguarde o Gradle sincronizar (1ª vez demora ~5 min).
- Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`
- Para versão de produção assinada: **Build → Generate Signed Bundle / APK**.

**Cada vez que você atualizar o app no Lovable:**
```bash
git pull && npm run build && npx cap sync android
```

### 📷 Permissões da câmera (já incluídas, mas confira)
Edite `android/app/src/main/AndroidManifest.xml` e garanta:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

---

## 💻 2. Gerar Executável Windows (.exe via Electron)

```bash
# 1. Instalar dependências
npm install
npm install --save-dev electron @electron/packager

# 2. Build da versão web
npm run build

# 3. Empacotar como .exe
npx @electron/packager . "EPI-Guard" \
  --platform=win32 --arch=x64 \
  --out=electron-release --overwrite \
  --ignore="node_modules/(?!(electron|@electron))" \
  --ignore="^/src" --ignore="^/android" --ignore="^/electron-release"
```

Saída em: `electron-release/EPI-Guard-win32-x64/EPI-Guard.exe`

Para Linux: `--platform=linux`. Para macOS: `--platform=darwin`.

> ⚠️ Antes do build, garanta que `vite.config.ts` tem `base: './'` (ver seção abaixo).

---

## ⚙️ Ajuste necessário no vite.config.ts (para Electron)

Para o `.exe` carregar os assets corretamente via `file://`, adicione no `vite.config.ts`:

```ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: { base: "./" },   // ← obrigatório para Electron
});
```

---

## 🔄 Fluxo recomendado

```text
Lovable (edita)
   ↓ git push
GitHub
   ↓ git pull
Sua máquina
   ├── npm run build
   ├── npx cap sync android  → Android Studio → APK
   └── npx @electron/packager → .exe Windows
```

---

## 📦 Onde fica cada coisa

| Arquivo | Função |
|---|---|
| `capacitor.config.ts` | Config do app Android (já criado ✅) |
| `electron/main.cjs` | Processo principal do Electron (já criado ✅) |
| `android/` | Projeto Android (criado por `npx cap add android`) |
| `dist/` | Build web (gerado por `npm run build`) |
| `electron-release/` | .exe final |

---

## 🆘 Problemas comuns

| Erro | Solução |
|---|---|
| Tela branca no `.exe` | Faltou `base: './'` no vite.config.ts → rebuild |
| Câmera não abre no APK | Verificar permissão `CAMERA` no AndroidManifest.xml |
| Gradle falha 1ª vez | Aceitar licenças: `sdkmanager --licenses` |
| App não carrega da rede | Em `capacitor.config.ts`, descomente `server.url` apontando para sua URL Lovable |
