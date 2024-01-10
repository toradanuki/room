<template>
  <v-app>
    <SidebarSum />

    <!-- 申請者リストコンテナ(カード) -->
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col v-for="(card) in cards" :key="card" cols="12">
          <v-card class="a">
            <v-subheader>{{ card }}</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in messages">
                <v-list-item :key="index" v-if="data.status == 'off'">
                  <!-- ここからmenu実装 -->
                  <!-- <v-menus v-model="menuIndex"> -->
                    <v-menu bottom min-width="200px" rounded offset-y>
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                          <v-list-item-avatar color="grey darken-1">
                            <v-img :src="data.photoURL"></v-img>
                          </v-list-item-avatar>
                        </v-btn>
                      </template>

                      <v-card>
                        <v-list-item-content class="justify-center">
                          <div class="mx-auto text-center">
                            <v-avatar color="brown">
                              <v-img :src="data.photoURL"></v-img>
                            </v-avatar>
                            <h3>{{ data.name }}</h3>
                            <p class="text-caption mt-1"></p>

                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text @click="toProfile">"*未 プロフィールを参照する"</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{ data.post }}</v-btn>
                          </div>
                        </v-list-item-content>
                      </v-card>
                    </v-menu>
                  <!-- </v-menus> -->

                  <v-btn @click="agree(data)" v-model=data.id>同意する</v-btn>
                  <v-btn @click="cancel(data)">拒否する</v-btn>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- これよりフレンドリストコンテナ -->
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col v-for="(card) in cards" :key="card" cols="12">
          <v-card class="a">
            <v-subheader>フレンド一覧</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in friends">
                <v-list-item :key="index">
                  <!-- ここからmenu実装 -->
                  <!-- <v-menus v-model="menuIndex"> -->
                    <v-menu bottom min-width="300px" rounded offset-y>
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                          <v-list-item-avatar color="grey darken-1">
                            <v-img :src="data.photoURL"></v-img>
                          </v-list-item-avatar>
                        </v-btn>
                      </template>

                      <v-card>
                        <v-list-item-content class="justify-center">
                          <div class="mx-auto text-center">
                            <v-avatar color="brown">
                              <v-img :src="data.photoURL"></v-img>
                            </v-avatar>
                            <h3>{{ data.name }}</h3>
                            <p class="text-caption mt-1"></p>

                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text @click="toPairRoom(data.name)">個人チャットを始める</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"*未 プロフィールを参照する"}}</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"閉じる" }}</v-btn>
                          </div>
                        </v-list-item-content>
                      </v-card>
                    </v-menu>
                  <!-- </v-menus> -->
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
      
      
      
<script>
import SidebarSum from '@/components/layouts/SidebarSum.vue';
import firebase from "@/firebase/firebase"

export default {
  data: () => ({
    messages: [],
  cards: ["受信一覧"],
  friends: [],
  dialog: false,
  menuIndex: "",
  auth: null,
  roomId: "",
  myuserid: "",
  mydocId: "",
  pairRoomId: "",
  names: "",
  drawer: null,
  joinmessage: "",
  }),
  components: { SidebarSum },

  mounted() {
    const auth = JSON.parse(sessionStorage.getItem('user'))
    const { displayname } = auth
    
    this.myuserid = auth.userId
    this.auth = auth
    this.names = displayname

    //フレンド情報の更新（申請者,新規フレンド）
    firebase.firestore().collection("userlist").where("displayname", "==", auth.displayname).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {

          this.mydocid = doc.id
          //申請者の確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('applicant').orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                
                this.messages.push(change.doc.data())
              })
            });
          //新規フレンドの確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('friend')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                
                this.friends.push(change.doc.data())
              })
            });
        })
      })
  },

  methods: {
    //個人部屋への移行
    async toPairRoom(pairName) {
      await firebase.firestore().collectionGroup('friend').where("name", "==", pairName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            
            this.pairRoomId = data.pairRoomId
          })
        })
      
      //これ、this.createdRoomIdいけん理由、vueにはデータ保持機能がないから。。。Nuxt.jsなら態々firestoreから呼び出さんでも済むんか。。今後要検討かな...負担的にも相手のpairroomidを取得する必要friends引数で、相手のu.id取得→自分のフレンドリストから、u.id一致するコレクション参照→pairroom取得
      this.$router.push({ path: '/chat', query: { room_id: this.pairRoomId } })
    },  
    //フレンド申請の承諾
    async agree(friendInfo) {
      this.value = true;
      const userListRef = firebase.firestore().collection("userlist");

      // 自分宛てへのフレンド申請者情報が格納されたdoc.idを取得(ToMeapplicantDoc.id)
      await firebase.firestore().collectionGroup('applicant').where("name", "==", friendInfo.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            
            this.applicantDocId = doc.id;
            
          });
        });

      // 申請者のステータスを変更し、受信一覧への描画を停止させる
      await userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
        status: "on"
      })
        .then(() => {
          
        })
        .catch(() => {
          
        });

      // **オブジェクトも引数としてとれる。そして異なるコンテキスト内でも各要素それぞれドット記法で呼び出せた**
      

      // ここから改修、合意後ルーム生成処理
      // ペアルーム向けに設定した部屋情報をfirestoreに渡す
      const roomRef = firebase.firestore().collection('rooms');

      await roomRef.add({
        createAt: firebase.firestore.Timestamp.now(),
        roomParameter: 1,
      });

      // 作成したペアルームのdoc.idを取得
      const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get();
      roomIdRef.forEach(doc => {
        this.createdRoomId = doc.id;
        
      });

      // 承諾した相手のユーザー情報、ルーム情報をフレンドリストに格納
      await userListRef.doc(this.mydocid).collection('friend').add({
        friendId: friendInfo.candidate,
        name: friendInfo.name,
        photoURL: friendInfo.photoURL,
        pairRoomId: this.createdRoomId
      });

      await userListRef.where("displayname", "==", friendInfo.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            this.parterDocId = doc.id;
          });
        });

      // 相手のdocidを取得
      // 相手側もフレンドリスト情報更新
      await userListRef.doc(this.parterDocId).collection('friend').add({
        friendId: this.auth.uid,
        name: this.auth.displayname,
        photoURL: this.auth.photoURL,
        pairRoomId: this.createdRoomId
      });
    },

    async cancel(friendInfo) {
      // 受信一覧からの表示をなくすだけの表示。
      const userListRef = firebase.firestore().collection("userlist");

      await firebase.firestore().collectionGroup('applicant').where("name", "==", friendInfo.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            
            this.applicantDocId = doc.id;
          });
        })
        .catch(() =>{

        }
        )

      await userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
        status: "on"
      })
        .then(() => {
          
        })
        .catch(() => {
          
        });
    }
  },
}

</script>
  
  <style>
  .card {
    margin: auto;
    padding: auto;
  }
  .a{
    margin: auto;
    padding: auto;
    width: 300px;
  }
  </style>