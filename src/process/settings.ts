/* eslint-disable import/no-extraneous-dependencies */
import SettingStore, { Settings } from '@/db/store/SettingStore';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

const settingStore = new SettingStore();

ipcMain.handle('get-current-account', () => settingStore.get(Settings.CurrentAccount, ''));

ipcMain.handle('save-current-account', async (event: IpcMainInvokeEvent, { accountId }: { accountId: string }) => {
  await settingStore.set(Settings.CurrentAccount, accountId);

  return true;
});
