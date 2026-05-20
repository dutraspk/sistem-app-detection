// Processo principal do Electron — empacota o EPI Guard como app Windows/.exe
// Arquivo .cjs (CommonJS) porque package.json usa "type": "module".
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0F172A",
    autoHideMenuBar: true,
    title: "EPI Guard",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Permite acessar câmeras locais (USB/IP) sem prompt extra
      webSecurity: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:8080");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Abre links externos no navegador padrão (e não dentro do app)
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
