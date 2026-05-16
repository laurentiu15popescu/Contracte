const { app, BrowserWindow, protocol, net, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { autoUpdater } = require("electron-updater");

const isDev = !!process.env.ELECTRON_DEV;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

async function handleAppProtocol(request) {
  const u = new URL(request.url);
  let pathname = decodeURIComponent(u.pathname);

  // Proxy ANAF
  if (pathname.startsWith("/anaf/")) {
    const target =
      "https://webservicesp.anaf.ro" + pathname.replace(/^\/anaf/, "");
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();
    const headers = new Headers(request.headers);
    headers.set("User-Agent", UA);
    headers.set("Accept", "application/json");
    headers.delete("origin");
    headers.delete("referer");
    headers.delete("cookie");
    return fetch(target, { method: request.method, headers, body });
  }

  // Proxy cursbnr.ro
  if (pathname.startsWith("/cursbnr/")) {
    const target = "https://www.cursbnr.ro" + pathname.replace(/^\/cursbnr/, "");
    const headers = new Headers();
    headers.set("User-Agent", UA);
    headers.set("Accept", "text/html,*/*");
    headers.set("Accept-Language", "ro-RO,ro;q=0.9,en;q=0.8");
    return fetch(target, { method: "GET", headers });
  }

  // Static files from dist/
  if (pathname === "/" || pathname === "") pathname = "/index.html";
  const distRoot = path.join(__dirname, "..", "dist");
  const filePath = path.normalize(path.join(distRoot, pathname));
  if (!filePath.startsWith(distRoot)) {
    return new Response("Forbidden", { status: 403 });
  }
  return net.fetch(pathToFileURL(filePath).toString());
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadURL("app://local/");
  }
}

app.whenReady().then(() => {
  protocol.handle("app", handleAppProtocol);
  createWindow();

  if (!isDev) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on("error", (err) => {
      console.error("[auto-update]", err == null ? "unknown" : err.message);
    });
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
