<template>
  <v-app>

    <v-avatar color="indigo">
      <input
        type="file"
        ref="fileInput"
        accept="image/jpeg, image/jpg, image/png"
        style="display: none"
        @change="updateIcon"
      >
      <v-icon dark v-if="!photoUrl" @click="changeIcon">
        mdi-account-circle
      </v-icon>
      <img
        :src="photoUrl"
        alt=""
        @click="changeIcon"
        v-if="photoUrl"
      />
    </v-avatar>

    <v-card flat class="card">
      <v-snackbar
        v-model="snackbar"
        absolute
        top
        right
        color="success"
      >
        <span>プロフィールの更新が完了しました</span>
        <v-icon dark>
          mdi-checkbox-marked-circle
        </v-icon>
      </v-snackbar>

      <v-form ref="form" @submit.prevent="submit">
        <v-container fluid>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.first"
                :rules="rules.name"
                color="purple darken-2"
                label="役職"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="form.bio" color="teal">
                <template v-slot:label>
                  <div>
                    プロフィール欄
                    <small>(100文字以内で入力して下さい)</small>
                  </div>
                </template>
              </v-textarea>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="form.favoriteAnimal"
                :items="animals"
                :rules="rules.animal"
                color="pink"
                label="目的"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-slider
                v-model="form.age"
                color="orange"
                label="年齢"
                hint="Be honest"
                min="1"
                max="100"
                thumb-label
              />
            </v-col>
            <v-col cols="12"></v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="primary" type="submit">
            登録する
          </v-btn>
        </v-card-actions>
      </v-form>

      <v-dialog v-model="terms" width="70%">
        <v-card>
          <v-card-title class="text-h6">Terms</v-card-title>
          <v-card-text v-for="n in 5" :key="n">
            {{ content }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="purple" @click="terms = false">
              Ok
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="conditions" width="70%">
        <v-card>
          <v-card-title class="text-h6">Conditions</v-card-title>
          <v-card-text v-for="n in 5" :key="n">
            {{ content }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="purple" @click="conditions = false">
              Ok
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-app>
</template>

<script>
// import firebase from "@/firebase/firebase"

import firebase from 'firebase';

export default {
  components: { },
  data() {
    const defaultForm = Object.freeze({
      first: '',
      last: '',
      bio: '',
      favoriteAnimal: '',
      age: null,
      terms: false,
    });

    return {
      form: Object.assign({}, defaultForm),
      rules: {
        age: [
          val => val < 10 || `I don't believe you!`,
        ],
        animal: [val => (val || '').length > 0 || 'この項目の入力は必須です'],
        name: [val => (val || '').length > 0 || 'この項目の入力は必須です'],
      },
      animals: ['大学受験', '資格取得', '試験勉強', '課題', 'その他'],
      conditions: false,
      content: "",
      snackbar: false,
      terms: false,
      defaultForm,
      photoUrl: "",
      drawer: null,
      auth: null,
      mydocid: "",
      uid: ""
    }
  },
  async created() {
    this.uid = this.$route.query.u_id;
  },

  mounted() {
    const auth = JSON.parse(localStorage.getItem('user'))
    this.myuserid = auth.userId
    this.auth = auth

    this.getMyProfile();
  },

  computed: {
    formIsValid() {
      return (
        this.form.first &&
        this.form.last &&
        this.form.favoriteAnimal &&
        this.form.terms
      )
    },
  },

  methods: {
    async getMyProfile(){
      //セッションストレージに格納していた自分のdispnameから、自身のプロフ格納ドキュメント元idを参照
    await firebase.firestore().collection("userlist").where("displayName", "==", this.auth.displayName).get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
        this.mydocid = doc.id
        
        })
    })

    await firebase.firestore().collection("userlist").doc(this.mydocid).get()
    .then((doc) => {
      
      const data = doc.data()
      this.form.first = data.post
      this.form.bio = data.profile
      this.form.favoriteAnimal = data.purpose
      this.form.age = data.age
    })

    },
    resetForm() {
      this.form = Object.assign({}, this.defaultForm)
      this.$refs.form.reset()
    },

    submit() {
      this.snackbar = true
      const userListRef = firebase.firestore().collection("userlist")
      userListRef.doc(this.mydocid).update({
        post: this.form.first,
        profile: this.form.bio,
        purpose: this.form.favoriteAnimal,
        age: this.form.age,
      })
    },

    changeIcon() {
      this.$refs.fileInput.click()
    },

    updateIcon() {
      const user = this.getAuth()
      if (!user) {
        localStorage.removeItem('user')
        this.$router.push('/login')
      }

      const file = this.$refs.fileInput.files[0]
      const filePath = `/user/${file.name}`

      firebase.storage().ref().child(filePath).put(file)
      .then(async snapshot => {
        
        const photoUrl = await snapshot.ref.getDownloadURL()
        
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            user.updateProfile({
              photoURL: photoUrl
            })
            this.auth.photoURL = photoUrl
            localStorage.setItem('user', JSON.stringify(this.auth))
          }
          this.photoUrl = photoUrl
        })
      })
    },

    getAuth() {
      return firebase.auth().onAuthStateChanged((user) => {
        return user
      })
    }
  },
}
</script>

<style>
.card {
  margin: auto;
  padding: auto;
}
</style>