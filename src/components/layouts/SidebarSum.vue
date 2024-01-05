<template>
  <v-div>
    <v-navigation-drawer v-model="drawer" app>
      <v-sheet color="grey lighten-4" class="pa-4">
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
          >
        </v-avatar>
        <div class="username">{{ auth && auth.displayname }}</div>
      </v-sheet>
      <v-divider></v-divider>
      <v-list>
        <v-list-item v-for="[icon, text,to] in links" :key="icon" :to="to" link>
          <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <!-- fff -->
        <v-list-item @click="logout">
          <v-list-item-icon>
            <v-icon color="light-blue"></v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>ログアウト</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <a href="https://ivory-taxicab-7e9.notion.site/4df4f979d21941d68d173cbd9fb0d967">
          <v-btn>※サイト紹介ページ</v-btn>
        </a>
      </v-list>
    </v-navigation-drawer>
  </v-div>
</template>

<script>
import firebase from 'firebase';

export default {
  mounted() {
    this.auth = JSON.parse(sessionStorage.getItem("user"));
    this.photoUrl = this.auth.photoURL;
  },
  data: () => ({
    photoUrl: "",
    drawer: null,
    auth: null,
    links: [
      ["mdi-account", "プロフィール", "/Profile"],
      ["mdi-account-group", "フレンドリスト", "/FriendList"],
      ["mdi-clipboard-account", "掲示板", "/Board"],
      ["mdi-clipboard-edit", "改修中"],
      ["mdi-human-greeting-proximity", "誰かと繋がる", "/"],
    ],
  }),
  methods: {
    logout() {
      firebase.auth().signOut()
        .then(() => {
          this.$router.push("/login");
          localStorage.message = "ログアウトに成功しました";
        })
        .catch(() => {});
    },
    changeIcon() {
      this.$refs.fileInput.click();
    },
    updateIcon() {
      const user = this.getAuth();
      if (!user) {
        sessionStorage.removeItem("user");
        this.$router.push("/login");
      }
      const file = this.$refs.fileInput.files[0];
      const filePath = `/user/${file.name}`;
      firebase.storage().ref().child(filePath).put(file)
        .then(async (snapshot) => {
          const photoUrl = await snapshot.ref.getDownloadURL();
          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              user.updateProfile({
                photoURL: photoUrl
              });
              this.auth.photoURL = photoUrl;
              sessionStorage.setItem("user", JSON.stringify(this.auth));
            }
            this.photoUrl = photoUrl;
          });
        });
    },
    getAuth() {
      return firebase.auth().onAuthStateChanged((user) => {
        return user;
      });
    }
  },
}
</script>