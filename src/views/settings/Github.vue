<template>
  <button @click="onGithubAccountClick">Add new GitHub account</button>

  <div v-for="(account, index) in accounts" :key="index" class="card" style="width: 200px;">
    <img :src="account.avatar" alt="" style="max-width: 100%; border-radius: 50%;" />

    {{ account.username }}

    <div>
      <button>Delete</button>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable import/no-extraneous-dependencies */
import { OauthIntegration } from '@/db/store/OauthIntegrationStore';
import Github from '@/integration/Github';
import { ipcRenderer } from 'electron';
import { Document } from 'nedb';
import { defineComponent, Ref, ref } from 'vue';

export default defineComponent({
  setup() {
    const onGithubAccountClick = async () => {
      const code = await ipcRenderer.invoke('github-authentication');
      const github = new Github();
      const token = await github.getAccessToken(code);
      const userData = await github.getUserData();

      await ipcRenderer.invoke('github-save-authentication-data', { userData, token });
    };

    const accounts: Ref<Array<Document<OauthIntegration>>> = ref([]);

    ipcRenderer.invoke('github-find-authentications').then((result) => {
      accounts.value = result;
    });

    return {
      onGithubAccountClick,
      accounts,
    };
  },
});
</script>
