<template>
    <v-app>
        <div class="login-box">
            <v-card class="login-form">
                <v-card-title class="login-title">SignUp</v-card-title>

                <v-car-subtitle>ユーザー情報を入力してください</v-car-subtitle>
                <v-btn color="light-blue" text to="Login">ログイン画面はこちら</v-btn>

                <v-form ref="form" v-model="valid" lazy-validation>

                    <v-text-field v-model="name" :rules="nameRules" label="UserName" required></v-text-field>


                    <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>

                    <v-text-field v-model="password" type="password" label="Password"></v-text-field>
                    <v-btn color="success" class="login-btn" @click="submit" :disabled="isvalid">SIGN UP</v-btn>
                    <v-btn @click="reset">Clear</v-btn>

                    <v-alert class="error-message" dense outlined type="error" v-if="errorMessage">
                        {{ errorMessage }}

                    </v-alert>
                </v-form>

            </v-card>
        </div>

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
          console.log("success", result)
          await result.user.updateProfile({ displayName: this.name });
                
          console.log("update user", result.user)

          localStorage.message = "新規作成に成功しました"

          firebase.auth().signInWithEmailAndPassword(this.email, this.password)
            .then((result) => {
              firebase.firestore().collection('userlist').add({
                userId: result.user.uid,
                displayname: result.user.displayName,
                photoURL: result.user.photoURL
              })
            })

          this.$router.push('/Login')
        })
        .catch((error) => {
          console.log("fail", error)
          this.errorMessage = "ユーザーの新規作成に失敗しました。";
        })
    }
  },
}

</script>

<style scoped>
.login-form {
    margin: 150px;
    padding: 30px;
}

.login-box {
    width: 50%;
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
