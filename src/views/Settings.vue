<template>
  <div style="display: flex;">
    <div style="flex: 0 0 300px;">
      <ul class="list-group">
        <li>
          Accounts

          <ul>
            <li>
              <router-link :to="{ name: 'GithubSettings' }">Github</router-link>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <div style="flex: 1; padding: 10px;">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return {
    };
  },
});
</script>
