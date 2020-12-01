/* eslint-disable import/no-extraneous-dependencies */
import {
  app, protocol, BrowserWindow, Menu, ipcMain, IpcMainInvokeEvent, shell, dialog,
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import NodeGit from 'nodegit';
import Github, { GithubAccessToken, GithubUserData } from './integration/Github';
import OauthIntegrationStore, { OauthIntegrationType } from './db/store/OauthIntegrationStore';
import './process/settings';

const isDevelopment = process.env.NODE_ENV !== 'production';

const isMac = process.platform === 'darwin';

let mainWindow: BrowserWindow;

const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New window',
    click() {
      console.log('New window');
    },
  },
]);

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
      // for more info
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html');
  }
}

ipcMain.handle('github-authentication', async () => {
  const github = new Github();
  const code = await github.authorize();

  return code;
});

ipcMain.handle('github-save-authentication-data', async (event: IpcMainInvokeEvent, { userData, token }: {userData: GithubUserData; token: GithubAccessToken}) => {
  const store = new OauthIntegrationStore();
  const data = {
    email: userData.email,
    username: userData.login,
    type: OauthIntegrationType.Github,
    avatar: userData.avatar_url,
    // eslint-disable-next-line @typescript-eslint/camelcase
    access_token: token.access_token,
    // eslint-disable-next-line @typescript-eslint/camelcase
    expires_in: token.expires_in,
    // eslint-disable-next-line @typescript-eslint/camelcase
    refresh_token: token.expires_in,
    // eslint-disable-next-line @typescript-eslint/camelcase
    refresh_token_expires_in: token.refresh_token_expires_in,
    scope: token.scope,
    // eslint-disable-next-line @typescript-eslint/camelcase
    token_type: token.token_type,
  };

  try {
    const alreadyStored = await store.findByUsername(userData.login);
    // eslint-disable-next-line no-underscore-dangle
    await store.update(alreadyStored._id, data);
  } catch (e) {
    await store.create(data);
  }

  return true;
});

ipcMain.handle('github-find-authentications', async () => {
  const store = new OauthIntegrationStore();
  const result = await store.findByType(OauthIntegrationType.Github);

  return result;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  return result.filePaths.length ? result.filePaths[0] : null;
});

ipcMain.handle('clone-repository', (event: IpcMainInvokeEvent, url: string, path: string, token: string) => {
  NodeGit.Clone.clone(url, path, {
    fetchOpts: {
      callbacks: {
        certificateCheck: () => 0,
        credentials: () => NodeGit.Cred.userpassPlaintextNew(token, 'x-oauth-basic'),
      },
    },
  });

  return true;
});

/* https://www.electronjs.org/docs/api/menu#main-process */
const template: Electron.MenuItemConstructorOptions[] = [
  { role: 'appMenu' },
  { role: 'fileMenu' },
  { role: 'editMenu' },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: () => shell.openExternal('https://electronjs.org'),
      },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  app.dock.setMenu(dockMenu);

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
