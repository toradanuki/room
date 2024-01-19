<template>
  <div id="app">
    <nav>
    </nav>
    <router-view/>  
  </div>
</template>

<script>
import firebase from "@/firebase/firebase"

export default {
  mounted() {
    this.$store.commit('setUrl',this.createdRoomId )

    this.getUserOnlineStatus();
  },
  methods: {
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