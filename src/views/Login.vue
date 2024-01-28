<template>
  <v-app>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3" align-self="center">
        <div class="login-box">
          <v-card class="login-form">
            <v-alert dense text type="success" v-if='message'>
              {{ message }}
            </v-alert>
            <v-alert class="error-message" text dense outlined type="error" v-if="errorMessage">
              {{ errorMessage }}
            </v-alert>
            <v-card-title class="login-title">ログイン</v-card-title>
            <v-card-subtitle>ユーザー情報を入力してください</v-card-subtitle>
            <v-btn color="light-blue" text to="Sign">新規登録はこちら</v-btn>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field v-model="email" :rules="emailRules" label="メールアドレス" required></v-text-field>
              <v-text-field v-model="password" type="password" label="パスワード"></v-text-field>
              <v-btn color="success" class="login-btn" @click="submit" :disabled="isvalid">ログイン</v-btn>
              <v-btn class="login-btn" text outlined @click="googleLogin" style="text-transform: none;">
                <img :src="googleIconUrl" alt="Google logo" style="height: 24px; vertical-align: middle; margin-right: 8px;">
                Googleでログイン
              </v-btn>
            </v-form>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-app>
</template>

<script>
import firebase from 'firebase';

export default {
  data: () => ({
    valid: true,
    email: '1@1.1',
    emailRules: [
      v => !!v || 'メールアドレスを入力してください',
      v => /.+@.+\..+/.test(v) || '正しいメールアドレスを入力してください',
    ],
    password: '12345678',
    message: '',
    errorMessage: '',
    docid: "",
    googleIconUrl: '',
  }),
  created() {
    // Storageからグーグルアイコンの取得
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const googleIconRef = storageRef.child('Google__G__logo.svg.png');

    googleIconRef.getDownloadURL()
      .then((url) => {
        this.googleIconUrl = url;
      })
      .catch((error) => {
        console.error('Failed to load Google icon from Firebase Storage:', error);
      });
  },

  mounted() {
    if (localStorage.message) {
      this.message = localStorage.message
      localStorage.message = ''
    }
  },

  computed: {
    isvalid() {
      return !this.valid;
    }
  },

  methods: {
    googleLogin() {
      
      // 認証を行うためのオブジェクトを取得
      const provider = new firebase.auth.GoogleAuthProvider();
      // ポップアップ画面でログインの検証
      firebase.auth().signInWithPopup(provider).then((result) => {
        const auth = {
          displayName: result.user.displayName,
          email: result.user.email,
          uid: result.user.uid,
          refreshToken: result.user.refreshToken,
          photoURL: result.user.photoURL
        }
        // ユーザー情報がなければ、追加する
        firebase.firestore().collection('userlist').where('userId', '==', result.user.uid).get()
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            // 'userlist'コレクションに同じuserIdのドキュメントが存在しない場合、新しいドキュメントを追加する
            firebase.firestore().collection('userlist').add({
              userId: result.user.uid,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL
            });
          }
        });

        this.$store.commit('setAuth', auth)
        localStorage.setItem('user', JSON.stringify(auth))
        this.$router.push('/')
        }).catch((error) => {
          // ロケールの日本語化
          if (error.code === 'auth/popup-closed-by-user') {
          this.errorMessage = 'ポップアップがユーザーによって閉じられました。再度ログインを試みてください。';
        } else if (error.code === 'auth/cancelled-popup-request') {
          this.errorMessage = '別のポップアップが開かれているため、操作がキャンセルされました。';
        }else {
          this.errorMessage = error.message;
        }
      });
    },
    reset() {
      this.$refs.form.reset()
    },
    submit() {
      firebase.auth().signInWithEmailAndPassword(this.email, this.password)
        .then((result) => {
          const auth = {
            displayName: result.user.displayName,
            email: result.user.email,
            uid: result.user.uid,
            refreshToken: result.user.refreshToken,
            photoURL: result.user.photoURL
          }
          this.$store.commit('setAuth', auth)
          localStorage.setItem('user', JSON.stringify(auth))
          this.$router.push('/')
        })
        .catch(() => {
          this.errorMessage = "ログインに失敗しました"
        })
    }
  }
}
</script>

<style scoped>
.login-form {
    margin: 0px;
    padding: 30px;
}

.login-box {
    width: 100%;
    margin: 0px auto;
    padding: 30px;
}

.login-title {
    display: inline-block;
    /* 要素の表示形式を決める、displayプロパティの設定。大まかに四種類に分けられ、この場合ログインタイトルに
    inline-block形式を充てている*/
}
.login-btn {
    margin-right: 20px;
}
</style>

