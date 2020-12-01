/* eslint-disable import/no-extraneous-dependencies */
import { BrowserWindow } from 'electron';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

export interface GithubAccessToken {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  scope: string;
  token_type: string;
}

export interface GithubUserData {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GithubRepositoryData {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: GithubUserData;
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  downloads_url: string;
  events_url: string;
  forks_url: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  notifications_url: string;
  pulls_url: string;
  releases_url: string;
  ssh_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  clone_url: string;
  mirror_url: string;
  hooks_url: string;
  svn_url: string;
  homepage: string;
  language: string|null;
  forks_count: number;
  stargazers_count: number;
  watchers_count: number;
  size: number;
  default_branch: string;
  open_issues_count: number;
  is_template: boolean;
  topics: Array<string>;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
  visibility: string;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  template_repository: string;
  temp_clone_token: string;
  delete_branch_on_merge: boolean;
  subscribers_count: number;
  network_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  };
}

export default class Github {
  private axios: AxiosInstance;

  private authorizationUrl = 'https://github.com/login/oauth/authorize?';

  private accessTokenUrl = 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token';

  private token: GithubAccessToken|undefined;

  constructor(token?: GithubAccessToken) {
    this.token = token;

    this.axios = this.createAxiosInstance();
  }

  public setToken(token: GithubAccessToken) {
    this.token = token;
  }

  public getUserData(): Promise<GithubUserData> {
    if (!this.token) return Promise.reject();

    return this.axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${this.token.access_token}`,
      },
    }).then((res) => res.data);
  }

  public listRepositories(): Promise<Array<GithubRepositoryData>> {
    if (!this.token) return Promise.reject();

    return this.axios.get('https://api.github.com/user/repos?per_page=100&type=all', {
      headers: {
        Authorization: `token ${this.token.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }).then((res) => res.data);
  }

  public getAccessToken(code: string): Promise<GithubAccessToken> {
    const data = new FormData();
    data.append('client_id', process.env.VUE_APP_GITHUB_CLIENT_ID as string);
    data.append('client_secret', process.env.VUE_APP_GITHUB_CLIENT_SECRET as string);
    data.append('code', code);

    return this.getToken(data);
  }

  public refreshToken(): Promise<GithubAccessToken> {
    if (!this.token) return Promise.reject();

    console.log(this.token);

    const data = new FormData();
    data.append('client_id', process.env.VUE_APP_GITHUB_CLIENT_ID as string);
    data.append('client_secret', process.env.VUE_APP_GITHUB_CLIENT_SECRET as string);
    data.append('refresh_token', this.token.refresh_token);
    data.append('grant_type', 'refresh_token');

    return this.getToken(data);
  }

  private getToken(data: FormData): Promise<GithubAccessToken> {
    return axios.post(this.accessTokenUrl, data, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((res) => res.data)
      .then((token: GithubAccessToken) => {
        this.setToken(token);

        return token;
      });
  }

  public authorize(): Promise<string> {
    const authenticationWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See
        // nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
        // for more info
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
        partition: uuidv4(),
      },
    });

    authenticationWindow.loadURL(
      `${this.authorizationUrl}client_id=${process.env.VUE_APP_GITHUB_CLIENT_ID}&scope=user,repo`,
    );

    authenticationWindow.show();

    return new Promise((resolve, reject) => {
      const handleCode = (url: string, event: string) => {
        console.log(event);
        const rawCode = /code=([^&]*)/.exec(url) || null;
        const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null;
        const error = /\?error=(.+)$/.exec(url);

        if ((code || error)) {
          // Close the browser if code found or error
          authenticationWindow.close();
        }

        if (code) {
          console.log(`code recieved: ${code}`);

          resolve(code);
        } else if (error) {
          reject(error);
        }
      };

      authenticationWindow.webContents.on('will-navigate', (event: Electron.Event, url: string) => handleCode(url, 'will-navigate')); // on first attempt
      authenticationWindow.webContents.on('will-redirect', (event: Electron.Event, url: string) => handleCode(url, 'will-redirect')); // on any other attempt
    });
  }

  private createAxiosInstance(): AxiosInstance {
    const instance = axios.create();

    instance.interceptors.request.use((request) => {
      if (this.token) {
        // eslint-disable-next-line no-param-reassign
        request.headers.Authorization = `token ${this.token.access_token}`;
      }

      return request;
    });

    instance.interceptors.response.use((response) => response, (error) => {
      if (error.config && parseInt(error.response.status, 10) === 401 && error.response.data.message === 'Bad credentials') {
        return this.refreshToken().then(() => {
          if (!this.token) return Promise.reject();

          // eslint-disable-next-line no-param-reassign
          error.config.headers.Authorization = `token ${this.token.access_token}`;
          console.log();
          return instance.request(error.config);
        });
      }

      return Promise.reject(error);
    });

    return instance;
  }
}
