import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase'
// import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    url:null,
    remakeId: null,
    roomId: null,
    auth: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setUrl(state,url){
      state.url = url
    },
    setAuth(state, auth){
      state.auth = auth
    },
    setRoomId(state, roomId) {
      state.roomId = roomId
    },
    setRemakeId(state, id) {
      state.remakeId = id;
    },
    // roomIdを削除するmutationを定義
    clearRoomId(state) {
      state.roomId = null;
    }
  },actions: {
    async checkAuthState({ commit }) {
      return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            commit('setAuth', user);
            resolve(user);
          } else {
            reject('No user authenticated');
          }
        });
      });
    }
  }
  // plugins: [createPersistedState()],
})