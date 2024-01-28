<template>
  <div>
    <v-navigation-drawer app color="white" class="elevation-4">
      <v-sheet tile flat class="pt-3 pb-5 px-3 white">
        <v-avatar size="120" class="mx-auto mb-4">
          <input 
            type="file"
            ref="fileInput"
            accept="image/jpeg, image/jpg, image/png"
            style="display: none"
            @change="updateIcon"
          >
          <v-icon dark v-if="!photoUrl" @click="changeIcon" size="120">
            mdi-account-circle
          </v-icon>
          <img 
            :src="photoUrl"
            alt=""
            @click="changeIcon"
            v-if="photoUrl"
            class="rounded-circle"
          >
        </v-avatar>
        <div class="text-center black--text subheading">{{ auth && auth.displayName }}</div>
      </v-sheet>
      <v-divider class="mx-3"></v-divider>
      <v-list dense nav class="white">
        <v-list-item v-for="[icon, text, to] in links" :key="icon" :to="to" link class="black--text">
          <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="logout" class="black--text">
          <v-list-item-icon>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>ログアウト</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>


<script>
import firebase from 'firebase';
export default {
  data: () => ({
    photoUrl: "",
    auth: null,
    links: [
      ["mdi-account", "プロフィール", "/Profile"],
      ["mdi-account-group", "フレンドリスト", "/FriendList"],
      ["mdi-clipboard-account", "掲示板", "/Board"],
      ["mdi-clipboard-edit", "作業記録","/Record"],
      ["mdi-human-greeting-proximity", "共同作業", "/"],
    ],
  }),
  mounted() {
    this.auth = JSON.parse(localStorage.getItem("user"));
    this.photoUrl = this.auth.photoURL;
  },
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
        localStorage.removeItem("user");
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
              localStorage.setItem("user", JSON.stringify(this.auth));
            }
            this.photoUrl = photoUrl;

            const userListRef = firebase.firestore().collection("userlist");
            userListRef.where("userId", "==", this.auth.uid).get().then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                userListRef.doc(doc.id).update({
                  photoURL: this.photoUrl
                });
              });
            });   
          });
        });
    },
    getAuth() {
      return firebase.auth().onAuthStateChanged((user) => {
        return user;
      });
    }
  }
}
</script>
<style>
</style>