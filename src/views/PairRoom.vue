<template>
  <v-app>
    <SidebarSum />
    <v-main>  
      <!-- コンテナの幅をfluidに拡張 -->
      <v-container fluid>
        <v-row>
          <v-col>
            <v-card>
              <!-- スクロール割り当てのdiv -->
              <div class="chat-window">      
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <!-- v-forの各要素は、vue.jsが一意に識別するためのkey属性が必須 -->
                    <!-- dividerはlistitem外なので、個別にkeyが必要 -->
                    <v-list-item :key="index">  
                      <v-btn icon>
                        <v-list-item-avatar>
                          <v-img :src="data.photoURL"></v-img>
                        </v-list-item-avatar>
                      </v-btn>
                      <v-list-item-content>
                        <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <!-- 区切り線を表示 -->
                    <!-- dividerはlistitem外なので、未使用のkeyが必要 -->
                    <v-divider :key="`二つ目の${index}`"></v-divider>
                  </template>
                </v-list>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-textarea v-model="body" append-icon="mdi-comment" class="mx-2" label="メッセージを送信する" rows="3" auto-grow></v-textarea>
      <v-btn class="mr-4" type="submit" :disabled="invalid" @click="submit">送信する</v-btn>
      <v-btn @click="clear">削除する</v-btn>
    </v-main>
  </v-app>
</template>
  
<script>
  import firebase from "@/firebase/firebase";
  import SidebarSum from "@/components/layouts/SidebarSum.vue";

  export default {
    data: () => ({
      messages: [],
      auth: null,
      body: "",
      roomId: "",      
    }),
  
    async mounted() {
      //クエリパラメータより、滞在中のページを識別し、振り分ける処理。取得したパラメータより
      //適切な内部データを抽出し、単一のviewから個々のページを展開できる。
      this.roomId = this.$route.query.room_id;
      this.auth = JSON.parse(sessionStorage.getItem('user'));
     
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
     
      // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
      roomRef.collection('messages').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            // 後にforに展開するために、messages配列に格納(配列代入につきpush)
            this.messages.push(change.doc.data());
          });
        });
    },
  
    methods: {
      clear() {
        this.body = "";
      },
      submit() {
        const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
        //送信者の情報、メッセージ内容をアップロードする
        roomRef.collection('messages').add(
          { 
          message: this.body, 
          name: this.auth.displayname,
          photoURL: this.auth.photoURL,
          createdAt: firebase.firestore.Timestamp.now(),
          userId: this.auth.uid,
          }
        )
        .then(() => {        
          this.body = "";
        })
        .catch(() =>{
          alert('メッセージの送信に失敗しました。')
        })
      },
    },
    components: { SidebarSum }
  }
</script>
  
<style>
  .message {
    text-align: left;
  }
  .chat-window {
    height: 400px; /* 適切な高さを設定します */
    overflow-y: auto; /* 垂直方向にスクロール可能にします */
  }
</style>