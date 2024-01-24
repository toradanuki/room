<template>
  <v-app>
    <v-row  justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3" align-self="center">
    <div class="login-box">
      <v-card class="login-form">
        <v-card-title class="login-title">新規登録</v-card-title>

        <v-card-subtitle>ユーザー情報を入力してください</v-card-subtitle>
        <v-btn color="light-blue" text to="Login">ログイン画面はこちら</v-btn>

        <v-form ref="form" v-model="valid" lazy-validation>
          <v-text-field v-model="name" :rules="nameRules" label="ユーザー名" required></v-text-field>
          <v-text-field v-model="email" :rules="emailRules" label="メールアドレス" required></v-text-field>
          <v-text-field v-model="password" type="password" label="パスワード"></v-text-field>
          <v-btn color="success" class="login-btn" @click="submit" :disabled="isvalid">登録する</v-btn>
          <v-btn @click="reset">取り消す</v-btn>

          <v-alert class="error-message" dense outlined type="error" v-if="errorMessage">
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card>
    </div>
      </v-col>
    </v-row>
  </v-app>
</template>

<script>
import firebase from "@/firebase/firebase"

export default {
  data: () => ({
    valid: true,
    name: '',
    nameRules: [
      v => !!v || '名前を入力してください',
      v => (v && v.length <= 10) || '名前は10文字以内で入力してください',
    ],
    email: '',
    emailRules: [
      v => !!v || 'メールアドレスを入力してください',
      v => /.+@.+\..+/.test(v) || '正しいメールアドレスを入力してください',
    ],
    password: '',
    errorMessage: "",
  }),

  computed: {
    isvalid() {
      return !this.valid;
    }
  },

  methods: {
    reset() {
      this.$refs.form.reset()
    },

    submit() {
      firebase.auth()
        .createUserWithEmailAndPassword(this.email, this.password)
        .then(async (result) => {
          
          await result.user.updateProfile({ displayName: this.name });

          

          localStorage.message = "新規作成に成功しました"

          firebase.auth().signInWithEmailAndPassword(this.email, this.password)
            .then((result) => {
              firebase.firestore().collection('userlist').add({
                userId: result.user.uid,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL
              })
            })

          this.$router.push('/Login')
        })
        .catch(() => {
          
          this.errorMessage = "ユーザーの新規作成に失敗しました。";
        })
    }
  },
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
}

.login-btn {
    margin-right: 20px;
}

.error-message {
    margin-top: 20px;
}
</style>
