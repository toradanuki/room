<template>
    <v-app>
      <!-- メニューバー -->
      <v-app-bar
        app
        color="primary"
        dark
        fixed
      >
      <!-- <component :is="currentComponent"></component> -->


        <!-- メニューアイコンはデスクトップでは非表示にする -->
        <v-btn icon @click.stop="toggleMenu" >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-toolbar-title>App Title</v-toolbar-title>
        <!-- デスクトップ環境ではメニューバー内のアイテムを表示 -->
        <v-spacer></v-spacer>
        <v-btn text>Item 1</v-btn>
        <v-btn text>Item 2</v-btn>
        <!-- 他のメニューアイテム -->
      </v-app-bar>
  
      <!-- メニューはデスクトップ環境では表示される -->
 

    <v-navigation-drawer v-model="menuVisible"  >
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
 

  
      <!-- ここにアプリケーションのコンテンツを配置 -->
    </v-app>
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
      menuVisible: false,
      
      auth: null,
      links: [
        ["mdi-account", "プロフィール", "/Profile"],
        ["mdi-account-group", "フレンドリスト", "/FriendList"],
        ["mdi-clipboard-account", "掲示板", "/Board"],
        ["mdi-clipboard-edit", "改修中","/Record"],
        ["mdi-human-greeting-proximity", "誰かと繋がる", "/"],
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
      },
      toggleMenu() {
        
        this.menuVisible = !this.menuVisible;
      },
    },
  }
  </script>

  <style>
  /* モバイルサイズでは非表示 */
  @media (max-width: 991px) {
    .v-navigation-drawer {
      display: none !important;
    }
    .d-lg-none {
      display: block !important;
    }
  }
  </style>