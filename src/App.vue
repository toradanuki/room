<template>
  <div id="app">
    <nav>
      <div v-if="showModal">
    <p>通信が切断されました。</p>
    <button @click="redirectToLogin">ログインページに戻る</button>
  </div>
    </nav>
    <router-view/>  
    <MenuBar v-if="!isLoginOrSignInPage" :style="{ 'margin-bottom': '50px' }" />
  </div>
  
</template>

<script>
import firebase from "@/firebase/firebase"
import MenuBar from '@/components/layouts/MenuBar.vue';

export default {
  data() {
  return {
    showModal: false,
    displayName:""
  };
},
  components: {
  
    MenuBar
  },
  computed: {
    // 現在のページがログインページまたはサインインページかどうかを判断する
    isLoginOrSignInPage() {
      return this.$route.name === 'Login' || this.$route.name === 'SignUp'; 
    },
    auth() {
    return this.$store.state.auth;
    }
  },
  async created() { 
    // Firebaseのロケール設定(エラーメッセージ等)をデバイス言語に統一
    firebase.auth().useDeviceLanguage();
    
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const auth = user
      
        this.$store.commit('setUser', user);
        this.$store.commit('setAuth', auth);
        // 認証システム切断確認で、ログインページに戻す
      } else if (!this.isLoginOrSignInPage) {
        this.showModal = true;
      }
    })
  },
  mounted() {
    this.$store.commit('setUrl',this.createdRoomId )

    this.getUserOnlineStatus();
  },
  methods: {
    redirectToLogin() {
    this.$router.push("/login");
    this.showModal = false;
  },
    getUserOnlineStatus(){
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          this.$store.commit('setUser', user)
          // Firebase Realtime Databaseの参照を取得
          const userStatusRef  = firebase.database().ref("status/" + user.displayName);
          //.infoノード/connectedは、接続を確認するコマンド的なもの。値はブーリアン型を取る。
          const connectedRef = firebase.database().ref(".info/connected");
          // ユーザーがオフラインになったときにステータスを更新
          userStatusRef.onDisconnect().set("offline");
          //接続を確認したら、オンラインステータスをセット
          connectedRef.on("value", (snap) => {
            if (snap.val() === true) {
              userStatusRef.set("online");
            } 
          })
        } 
      })
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.grey.darken-1 {
  background-color: #757575!important;
  border-color: #757575!important;
}
.username {
  padding-top: 10px;
  font-size: small;
}
</style>