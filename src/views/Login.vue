<template>
    <v-app>

        <p>ゲストログイン用 mail:1@1.1  ps:12345678  サブ 2@1.1 ps 同上</p>
        <div class="login-box">
            <v-card class="login-form">

                <v-alert dense text type="success" v-if='message'>
                    {{ message }}
                </v-alert>
                <v-alert class="error-message" text dense outlined type="error" v-if="errorMessage">
                    <!--dense=密集させる、テキストフィールドの高さを縮める
                        outlined=アラートボックスに輪郭をつける type=用意されたアラートのデザイン-->
                    {{ errorMessage }}

                </v-alert>
                <v-card-title class="login-title">Login</v-card-title>
                <v-car-subtitle>ユーザー情報を入力してください</v-car-subtitle>
                <v-btn color="light-blue" text to="Sign">新規登録はこちら</v-btn>

                <v-form ref="form" v-model="valid" lazy-validation>
                    <!-- clear validation機能をテキストフィールドで有効にするためのv-form? -->
            



                    <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
                    <!-- formコンポーネントが親として機能し、子の"入力コンポーネント"にあたるtext-fieldをrulesに則った
                    validationで一元管理を行っている。その処理形態として、rulesが満たされないときv-modelを介して
                    validにfalseを渡す。するとcomputedが値変更を検知し、isvalidが作動→disabled右辺にtrue返却
                    →disable活性化し、ログインボタンが無効になる-->

                    <v-text-field v-model="password" type="password" label="Password"></v-text-field>
                    <v-btn color="success" class="login-btn" @click="submit" :disabled="isvalid">Login</v-btn>
                    <v-btn @click="reset">Clear</v-btn>
                </v-form>

            </v-card>
        </div>

    </v-app>
</template>


  
<script>
import firebase from 'firebase';
export default {
    data: () => ({
        valid: true,
        // name: '',
        // nameRules: [
        //     v => !!v || 'メールアドレスを入力してください',
        //     v => (v && v.length <= 10) || '正しいメールアドレスを入力してください',
        // ],
        email: '',
        emailRules: [
            v => !!v || 'メールアドレスを入力してください',
            v => /.+@.+\..+/.test(v) || '正しいメールアドレスを入力してください',
        ],
        password: '',
        message: '',
        errorMessage: '',
        docid:""

    }),



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
       
        
        reset() {
            this.$refs.form.reset()
        },
        //↑上３つのメソッドはvuetifyのv-form APIに元から割り当てられている(格納)
        //公式ドキュメントに則った記述を行っており、実装中の"this.$refs.form.reset()"1文で一つの関数
        //フォーム内の入力内容及び全てのバリデーションエラーをリセットする機能を有する
        //つまり元から用意されている関数が扱え、必要な機能(メソッド)を自ら実装する手間を省くことができる

        submit() {
            firebase.auth().signInWithEmailAndPassword(this.email, this.password)
                .then((result) => {
                    console.log("success", "user", result.user)




                    const auth = {
                        displayname: result.user.displayName,
                        email: result.user.email,
                        uid: result.user.uid,
                        refreshToken: result.user.refreshToken,
                        photoURL: result.user.photoURL

                    }






 sessionStorage.setItem('user', JSON.stringify(auth))
                    this.$router.push('/')

                })
                .catch(() => {

                    this.errorMessage = "ログインに失敗しました"
                }
                )
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
    /* 要素の表示形式を決める、displayプロパティの設定。大まかに四種類に分けられ、この場合ログインタイトルに
 inline-block形式を充てている*/
}

.login-btn {
    margin-right: 20px;
}
</style>

