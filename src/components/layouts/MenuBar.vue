<template>
  <v-app>
    <v-app-bar app color="primary" fixed class="justify-center app-bar ">
      <v-btn icon @click.stop="toggleMenu" class="d-lg-none">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-btn v-for="[icon, text, to] in links" :key="icon" :to="to" class="button" >
        <span class="small-text">{{ text }}</span>
        <v-icon small>{{ icon }}</v-icon>
      </v-btn> 
    </v-app-bar>
    <SidebarSum />
  </v-app>
</template>
  
  <script>
  import firebase from 'firebase';
import SidebarSum from './SidebarSum.vue';
  
  export default {
    mounted() {
        this.auth = JSON.parse(sessionStorage.getItem("user"));
        this.photoUrl = this.auth.photoURL;
    },
    data: () => ({
        photoUrl: "",
        menuVisible: false,
        auth: null,
        links: [
            ["mdi-account", "", "/Profile"],
            ["mdi-account-group", "友達", "/FriendList"],
            ["mdi-clipboard-account", "質問", "/Board"],
            ["mdi-clipboard-edit", "記録", "/Record"],
            ["mdi-human-greeting-proximity", "共同", "/"],
        ],
        return: {
            menuVisible: false,
            currentComponent: "",
        }
        //なぜかリターン単体で初期値false,data(){}形式たすとtrue,同じようにfalseをdata部に
        //にかきなおすとfalse解決、、
    }),
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
        },
        toggleMenu() {
            this.menuVisible = !this.menuVisible;
        },
    },
    components: { SidebarSum }
}
  </script>

  <style>
  /* min = ~px以上、max = px以下に適応。 */
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
/* .button {
  flex-direction: column;
} */

  </style>