import { createStore } from 'vuex';

export default createStore({
  state: {
    currentAccount: null,
  },
  mutations: {
    setCurrentAccount(state, account) {
      state.currentAccount = account;
    },
  },
  actions: {
  },
  modules: {
  },
});
