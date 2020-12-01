import Nedb from 'nedb';

export enum Settings {
  CurrentAccount = 'current-account',
}

export interface Setting {
  key: Settings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export default class SettingStore {
  private collection: Nedb<Setting>;

  constructor() {
    this.collection = new Nedb<Setting>({
      filename: `${process.cwd()}/db/settings.db`,
      autoload: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get(key: Settings, defaultValue: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ key }, (error, document) => {
        if (error) reject(error);
        else if (!document) resolve(defaultValue);
        else resolve(document.value);
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public set(key: Settings, value: any): Promise<boolean> {
    console.log(value);
    return new Promise((resolve, reject) => {
      this.collection.findOne({ key }, (error, document) => {
        if (error) reject(error);
        else if (!document) {
          this.collection.insert({ key, value }, (insertionError) => {
            if (insertionError) reject(insertionError);
            else resolve(true);
          });
        } else {
          this.collection.update({ key }, { value }, undefined, (updateError) => {
            if (updateError) reject(updateError);
            else resolve(true);
          });
        }
      });
    });
  }

  public clear(key: Settings): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.collection.remove({ key }, {}, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }
}
