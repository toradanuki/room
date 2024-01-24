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
      return this.$route.name === 'Login' || this.$route.name === 'SignUp'; // 'Login'と'SignIn'はログインページとサインインページのルート名
    },
    // これでvuex x computed x onAuthStateChanged の、安全で複数アカウント対応
    // の認証システムに刷新できました！！よかたぁ・！わりと知識増えてきたよね・・？笑リスナーとかさ！

    //よしこの際置換試みるか・・？でもfirebaseデータ違うと詰む？？既存データの読み込みだけか・・？？
    //うーんびみょうけど、でも全部一括でかえたらはやい。。？？このまま半乗り換えとするなら、認証システムの
    //堅牢化するなら、そのうえで"N" だけdisplayName変えなあかんもんなぁ。。うーん・・
    // 無難にそうするか・・・？？代入前に変える感じで。のりかえ

    //はいこの受け取りふつーーーーーーーーーーーに直読み出しむりでしたなんやねんｗｗｗｗ
    //素直に呼び出しましょう、これはただvuexをリアクティブに管理するための設計よん、。
    //でもセッションストレージを代わりにここに置いたらどうなん・・？？onAuth全検知→最新情報セッション格納
    //んでセッション変数をcomputedにおいて再代入準備。ん、むりか？
    auth() {
    return this.$store.state.auth;
  }
  },
  async created() {
    //再設計、リフレッシュ時にも毎回firebaseから個人情報を取得し、vuexに格納するようにする
    // リスナー式ではなくて標準的なvuexの値の初期化を行うことで、認証の変更が認めらないイベントへの
    //対応を図る。（vuexデータの方がセッションストレージよりも更に保持は脆い。揮発メモリに保持されるだけ
    //なので。ただリアクティブな変化とセキュリティ面で強力なのでがんばるます

    //まさかのcurrentuserは同期処理でした。おわた（認証情報まだでオフですｗならどっちみち）






    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log("これ終わるとつみくさい",user)
        // auth 遂に導入します！
        // 初期段階の命名漏れをここで対応しときます、。。、キーの変更ね。

        //全てのプロパティを継承し、display"N"ameを小文字に統一した新たなキー名
        //(prop= key+ value)で、新規プロパティを作成する対応処理

        //げえ。。むりでしたん。。。うわん。。
        //一新するかぁ。。。ちょっと手間やけど、、保守性。。

        //まさかのdisplayNameがなかった、
        const auth = user
       //へえ初期から？うそん、たさなかあん？ログインでたせるっけ、永遠格納する感じの
       //むりかなぁ、どうやってたんやあるはず

        
       this.$store.commit('setUser', user);
        this.$store.commit('setAuth', auth);
        //それか開幕素直にセットが必要節？
        // this.$store.state.auth;

        console.log(user,auth,auth.uid,auth.displayName,this.$store.state.auth,"はい？？？？ほんまにリフレッシュたえてますん？？？")
        // 認証システム切断確認で、ログインページに戻す
      } else if (!this.isLoginOrSignInPage) {
        this.showModal = true;
      }
    });

    for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}: ${value}`);
}
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    console.log(`this is seeeeeeeeeeeeeeeeeeeeeion${key}: ${value}`);
  }
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