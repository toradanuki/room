<template>
  <div id="app">
    <nav>

    </nav>

    <router-view/>  
 
  </div>

  

</template>

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

<script>
 import firebase from "@/firebase/firebase"

  export default {
  
     mounted() {
      //vuexでセッションストレージ以外にデータ格納（共有取得はまだ未実装）
      this.$store.commit('setUrl',this.createdRoomId )

      //if 特定のvuexデータがあれば→そのページへルータープッシュ
      //それ個々に共有で書いていいと思う。んで正規の部屋離脱処理にて、その規則を廃止。かな。
      //まあそれはチャットボードで一連の処理記述できてからか、うむ、でも一つ学びました・・！
      //というより割と広範にかな、何気




      firebase.auth().onAuthStateChanged(user => {
    if (user) {
     this.$store.commit('setUser', user)
    
    } 
  })
     }
}
</script>
