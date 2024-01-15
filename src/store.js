import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    url:null,
    remakeId: null
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setUrl(state,url){
      state.url = url

    },
    setRemakeId(state, id) {
      state.remakeId = id;
    }
  },
  plugins: [createPersistedState()],
})