<template>
  <div class="navbar">
    <div class="navbar-brand" @click="openCloseLeftSidebar">
      <i class="fas fa-bars fa-lg" />

      <template v-if="$store.state.currentAccount">
        <img
          v-if="$store.state.currentAccount.avatar"
          :src="$store.state.currentAccount.avatar"
          style="border-radius: 50%; width: 40px; margin: 0 8px;"
        />

        {{ $store.state.currentAccount.username }}
      </template>
    </div>

    <a
      v-if="$store.state.currentAccount"
      href="#"
      class="navbar-link"
      @click.prevent="openCloneDialog"
    >
      Clone
    </a>

    <div class="spacer" />

    <router-link to="/" class="navbar-link">Home</router-link>

    <router-link :to="{ name: 'Settings' }" class="navbar-link">Settings</router-link>
  </div>

  <router-view class="content" />

  <div class="sidebar px-2" :class="{ open: isLeftSidebarOpen }">
    <select v-model="selectedAccount">
      <option value="">Choose account</option>
      <option v-for="(account, index) in accounts" :key="index" :value="account._id">
        {{ account.username }} ({{ account.type }})
      </option>
    </select>
  </div>

  <Dialog v-model="shouldShowCloneDialog">
    <div class="card">
      <template v-if="!selectedRepository">
        <div
          v-for="(repository, index) in repositories"
          :key="index"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          "
        >
          {{ repository.name }}

          <button style="margin-left: 10px;" @click="selectedRepository = repository">
            Clone
          </button>
        </div>
      </template>

      <template v-else>
        <div>{{ selectedRepository.name }}</div>

        <div>{{ selectedRepository.clone_url }}</div>

        <div style="display: flex;">
          <input v-model="selectedRepositoryPath" />

          <button @click="selectRepositoryPath">
            Choose path
          </button>
        </div>

        <button style="margin-left: 10px;" @click="cloneSelectedRepository">
          Clone
        </button>
      </template>
    </div>
  </Dialog>
</template>

<script lang="ts">
/* eslint-disable import/no-extraneous-dependencies */
import { ipcRenderer } from 'electron';
import { Document } from 'nedb';
import {
  defineComponent, Ref, ref, watch,
} from 'vue';
import path from 'path';
import { OauthIntegration } from './db/store/OauthIntegrationStore';
import Github, { GithubAccessToken, GithubRepositoryData } from './integration/Github';
import store from './store';
import Dialog from './components/ui/Dialog.vue';

export default defineComponent({
  components: {
    Dialog,
  },

  setup() {
    // sidebar
    const isLeftSidebarOpen = ref(false);

    const openCloseLeftSidebar = () => {
      isLeftSidebarOpen.value = !isLeftSidebarOpen.value;
    };

    // accounts
    const accounts: Ref<Array<Document<OauthIntegration>>> = ref([]);
    const selectedAccount = ref('');

    watch(selectedAccount, () => {
      store.commit('setCurrentAccount', accounts.value.find(
      // eslint-disable-next-line no-underscore-dangle
        (account) => account._id === selectedAccount.value,
      ));

      if (store.state.currentAccount) {
        ipcRenderer.invoke('save-current-account', { accountId: selectedAccount.value });
        isLeftSidebarOpen.value = false;
      }
    });

    const loadAccounts = async () => {
      accounts.value = await ipcRenderer.invoke('github-find-authentications');

      if (selectedAccount.value) {
        store.commit('setCurrentAccount', accounts.value.find(
        // eslint-disable-next-line no-underscore-dangle
          (account) => account._id === selectedAccount.value,
        ));
      }
    };

    const loadSelectedAccount = async () => {
      selectedAccount.value = await ipcRenderer.invoke('get-current-account');

      store.commit('setCurrentAccount', accounts.value.find(
      // eslint-disable-next-line no-underscore-dangle
        (account) => account._id === selectedAccount.value,
      ));
    };

    // repositories
    const selectedRepository: Ref<GithubRepositoryData|undefined> = ref();
    const selectedRepositoryPath: Ref<string> = ref('');
    const repositories: Ref<Array<GithubRepositoryData>> = ref([]);

    const listRepositories = async () => {
      if (!store.state.currentAccount) return Promise.reject();

      const github = new Github((store.state.currentAccount as unknown) as GithubAccessToken);

      repositories.value = await github.listRepositories();

      return Promise.resolve();
    };

    const selectRepositoryPath = async () => {
      const result = await ipcRenderer.invoke('select-directory');

      if (result) {
        selectedRepositoryPath.value = `${result}${path.sep}${selectedRepository.value?.name}`;
      }
    };

    const cloneSelectedRepository = () => {
      ipcRenderer.invoke('clone-repository', selectedRepository.value?.clone_url, selectedRepositoryPath.value, ((store.state.currentAccount as unknown) as GithubAccessToken).access_token);
    };

    const shouldShowCloneDialog = ref(false);

    const openCloneDialog = () => {
      shouldShowCloneDialog.value = true;
      listRepositories();
    };

    return {
      isLeftSidebarOpen,
      openCloseLeftSidebar,
      accounts,
      selectedAccount,
      loadAccounts,
      loadSelectedAccount,
      selectedRepository,
      selectedRepositoryPath,
      repositories,
      listRepositories,
      selectRepositoryPath,
      cloneSelectedRepository,
      shouldShowCloneDialog,
      openCloneDialog,
    };
  },

  mounted() {
    this.loadAccounts();
    this.loadSelectedAccount();
  },
});
</script>
