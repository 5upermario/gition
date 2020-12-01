import Nedb, { Document } from 'nedb';

export enum OauthIntegrationType {
  Github = 'github',
}

export interface OauthIntegration {
  email: string;
  username: string;
  type: OauthIntegrationType;
  avatar?: string;
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  scope?: string;
  token_type?: string;
}

/* interface Crud<T> {
  create(data: T): Promise<T>;
  update()
} */

export default class OauthIntegrationStore {
  private collection: Nedb<OauthIntegration>;

  constructor() {
    this.collection = new Nedb<OauthIntegration>({
      filename: `${process.cwd()}/db/oauth-integrations.db`,
      autoload: true,
    });
  }

  create(data: OauthIntegration): Promise<Document<OauthIntegration>> {
    return new Promise((resolve, reject) => {
      this.collection.insert(data, (error, document) => {
        if (error) reject(error);
        else resolve(document);
      });
    });
  }

  get(id: string): Promise<Document<OauthIntegration>> {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: id }, undefined, (error, document) => {
        if (error) reject(error);
        else if (document === null) reject(new Error('Document not found'));
        else resolve(document);
      });
    });
  }

  update(id: string, data: OauthIntegration): Promise<number> {
    return new Promise((resolve, reject) => {
      this.collection.update({ _id: id }, data, {}, (error, affectedRowCount) => {
        if (error) reject(error);
        else resolve(affectedRowCount);
      });
    });
  }

  delete(id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: id }, {}, (error, deleteCount) => {
        if (error) reject(error);
        else resolve(deleteCount);
      });
    });
  }

  findByType(type: OauthIntegrationType): Promise<Array<Document<OauthIntegration>>> {
    return new Promise((resolve, reject) => {
      this.collection.find({ type }, (error, documents) => {
        if (error) reject(error);
        else resolve(documents);
      });
    });
  }

  findByUsername(username: string): Promise<Document<OauthIntegration>> {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ username }, (error, document) => {
        if (error) reject(error);
        else if (document === null) reject();
        else resolve(document);
      });
    });
  }
}
