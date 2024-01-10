<template>
  <v-app>
    <v-card max-width="800" class="card">
      <v-row justify="center">
        <v-expansion-panels accordion v-model="panel">
          <v-expansion-panel v-for="post in posts" :key="post.id">
            <v-expansion-panel-header>{{post.category}}:{{post.title}}</v-expansion-panel-header>
            <v-expansion-panel-content>
              {{post.content}}
            </v-expansion-panel-content>
            <v-expansion-panel-content>
              回答:{{post.answer}}
            </v-expansion-panel-content>
            <v-expansion-panel-content>
              <v-text-field v-model="answer" placeholder="回答"></v-text-field>
              <v-btn color="success" class="login-btn" @click="answerSubmit">送信</v-btn>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-row>
    </v-card>
    <v-chip v-if="notice" class="chip" close color="green" outlined @click:close="notice = false">
      {{ notice }}
    </v-chip>
    <v-row justify="center">
      <v-dialog v-model="dialog" persistent max-width="600px">
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="primary" dark v-bind="attrs" v-on="on" class="btn">
            スレッドを投稿する
          </v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">投稿フォーム</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="title" label="タイトル" required></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="body" label="内容" required></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="category" :items="['雑談', '質問', '募集', 'その他']" label="カテゴリー" required></v-select>
                </v-col>
              </v-row>
            </v-container>
            <small></small>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="dialog = false">
              キャンセル
            </v-btn>
            <v-btn color="blue darken-1" text @click="submit">
              投稿する
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>
    <!-- <SidebarSum /> -->
    <MenuBar />
  </v-app>
</template>
    
<script>
// import firebase from "@/firebase/firebase"
// import SidebarSum from '@/components/layouts/SidebarSum.vue';
import MenuBar from '@/components/layouts/MenuBar.vue';
import firebase from "@/firebase/firebase"

export default {
  data: () => ({
    dialog: false,
    notice: "",
    body: "",
    title: "",
    category: [],
    posts: [],
    answer: "",
    panel: "",
    answerId: ""
  }),

  methods: {
    async answerSubmit() {
      
      //展開中のパネルを識別する処理、sliceでposts配列から目的のpanelのindexを取得。panelはv-modelより
      const matchAnswer = this.posts.slice(this.panel, this.panel + 1);

      matchAnswer.forEach(value => {
        
        this.answerId = value.id;
      });

      const postRef = firebase.firestore().collection('posts').doc(this.answerId);

      postRef.set({ answer: this.answer }, { merge: true })
        .then(() => {
          
          this.notice = "回答の送信に成功しました";
        })
       
    },

    async submit() {
      
      const postRef = firebase.firestore().collection('posts');

      await postRef.add({
        title: this.title,
        content: this.body,
        category: this.category,
        createdAt: firebase.firestore.Timestamp.now()
      })
        .then(() => {
          
          this.notice = "スレッドの作成に成功しました";
          this.dialog = false;
        });
    },

    async getposts() {
      this.posts = [];
      const pastRef = firebase.firestore().collection('posts');
      const postRefs = await pastRef.get();

      postRefs.forEach(doc => {
        const data = { ...doc.data() };
        data.id = doc.id;
        this.posts.push(data);
        
      });
    }
  },

  mounted() {
    this.getposts();
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        user.id = user.uid;
        
      }
    });
  },

  components: { MenuBar },
  
}
</script>

<style scoped>
.card {
  margin:auto
}
.btn{
  margin:auto
}
.chip{width: 50%;
    margin: auto;
    padding: 30px;
}
</style>