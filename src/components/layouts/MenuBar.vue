<template>
  <v-app>
    <v-app-bar app color="grey darken-4" dark dense class="elevation-4">
      <v-toolbar-title>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-for="[icon, text, to] in links" :key="icon" :to="to" text class="mx-2 button white--text">
        <v-icon left class="white--text">{{ icon }}</v-icon>
        <span class="caption white--text">{{ text }}</span> <!-- ボタン内テキストも白色に -->
      </v-btn>
    </v-app-bar>
    <SidebarSum />
  </v-app>
</template>
  
<script>
import firebase from 'firebase';
import SidebarSum from './SidebarSum.vue';

export default {
  
  data: () => ({
    photoUrl: "",
    menuVisible: false,
    auth: null,
    currentComponent: "",
    links: [
   
      ["mdi-human-greeting-proximity", "共同", "/"],
      ["mdi-account-group", "友達", "/FriendList"],
      ["mdi-clipboard-account", "質問", "/Board"],
      ["mdi-clipboard-edit", "記録", "/Record"],
      ["mdi-account", "", "/Profile"],
      
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
        .catch(() => { });
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
          });
        });
    },
    getAuth() {
      return firebase.auth().onAuthStateChanged((user) => {
        return user;
      });
    },
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
    },
  },
  components: { SidebarSum }
}
</script>
<style>
/* min = ~px以上、max = px以下に適応。 
1252px以上では自動でサイドバーが展開される*/
@media (min-width: 1252px) {
  .app-bar {
  display: none !important;
  }
} 
@media (max-width: 700px) {
  .v-navigation-drawer {
  display: none !important;
  }
  .d-lg-none {
    display: none !important;
  }
} 
.v-btn > span {
display: block;
}
.v-btn > .v-icon {
  display: block;
}
.small-text {
  font-size: 12px;
}
</style>