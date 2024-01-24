<template>
  <v-app>
    <SidebarSum />

    <input v-model="searchTerm" type="text" placeholder="Search by display name">
    <button @click="search">Search</button>
    <ul>
      <li v-for="user in filteredUsers" :key="user.id">
        {{ user.displayName }}ffff
      </li>
    </ul>

    <!-- 申請者リストコンテナ(カード) -->
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col v-for="(card) in cards" :key="card" cols="12">
          <v-card class="cardbox">
            <v-subheader>{{ card }}</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in messages">
                <v-list-item :key="index" v-if="data.status == 'off' && status ">
                    <v-menu bottom min-width="200px" rounded offset-y>
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                          <v-list-item-avatar color="grey darken-1">
                            <v-img :src="data.photoURL" v-if="status"></v-img>
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
                            <v-btn depressed rounded text @click="toProfile">         
                            </v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{ data.post }}</v-btn>
                          </div>
                        </v-list-item-content>
                      </v-card>
                    </v-menu>
                  <v-btn @click="acceptFriendRequest(data)" v-model=data.id>同意する</v-btn>
                  <v-btn @click="rejectFriendRequest(data)">拒否する</v-btn>
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
          <v-card class="cardbox">
            <v-subheader>フレンド一覧</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in friends">
                <v-list-item :key="index">

                    <v-menu bottom min-width="300px" rounded offset-y>
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                            <v-badge dot :color="isStatus === 'online' ? 'green' : '#808080'" overlap>  
                              <template v-slot:badge> </template> 
                              <v-list-item-avatar color="grey darken-1">
                                <v-img :src="data.photoURL"></v-img>
                              </v-list-item-avatar>
                            </v-badge>
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
                            <v-btn depressed rounded text @click="toProfile(data,index)">プロフィールを参照する</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"閉じる" }}</v-btn>
                          </div>
                        </v-list-item-content>
                      </v-card>
                    </v-menu>
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
  friendName:"",
  auth: null,
  status:"true",
  roomId: "",
  friendids:"",
  myuserid: "",
  mydocId: "",
  pairRoomId: "",
  isStatus:"",
  names: "",
  searchTerm: '',
      users: []
  }),
  components: { SidebarSum },

  mounted() {
    //  ↓このコマンドすごいｗｗ不具合系一気に解消できるｗｗたまりすぎたローカルストレージ群
    // まとめてりせっとできます！！！これで複数アカウント系ログインエラー一網打尽やでい！！
    // 目から鱗なこと今になって物凄いおおいな。。。ｗまああんまり目を向けてなかったのが大きいのか。。。ｗ
    // localStorage.clear();


    // storeを認証情報に使うこと廃止。ローカルストレージ中身確認にて、
    // 複数アカウントでのログイン時、オプションでvuexの場合自動ローカル保存→
    // ローカルストレージはブラウザのドメインに紐づけされているので、たとえタブが異なっても
    // データが同じキーによる値として更新されてしまうので。なので接続に対して固有の内部データの振り分け
    // する必要がある。よってこれまでsessionストレージを使っていたので成立していた。それはブラウザが同じで
    // あっても、タブ固有の接続に対するセッション管理で、その内部にデータを格納していたため。ただそのとき
    // リロードなどでデータが失われる可能性はあるは、確かその時、セッションデータ損失＝認証失敗で阻止していた
    // のか、onstateでリスナーおいて更新していたのかはわからないけど、不都合なかったみたい。
    // なのでこれ改めて、セッションへの格納と取得に入れ替える。どうやらmixin系列でlocalにまだ置き換えてしまって
    // るのでエラー生じてた模様なので。ほか接続中断でもリスナーで検知して、appvueのほうでモーダルとリダイレクト
    // わかりやすく設定したから、エラーハンドリングや状況把握も今後は容易だと思いますので。ストレージハンドリングの
    // 術も今更ながら身に付きましたので、ここでいっちょ今後の状態確認エラーなどを防ぐためにもやっていきます
    // 空のメッセージエラー系も、多分auth損失、認証失敗ながらそこへのハンドリン具が未実装で起こってた可能性も
    // 考えられるからね。うんうん、いこかここは。基本をね。
    this.auth = JSON.parse(sessionStorage.getItem("user"));
  // const { displayName } = auth
  // this.myuserid = auth.uid
  // this.auth = auth
  // this.names = displayName
  this.fetchUsers();
  this.updateFriendList();
  this.getFriendStatus();
  },
  computed: {
    filteredUsers() {
      console.log("fdf")
      if (!this.searchTerm) {
       return null;
      }else{
      return this.users.filter(user => user.displayName.startsWith(this.searchTerm))
      }
    }
  },
  methods: { 
    async fetchUsers() {
      const db = firebase.firestore()
      const snapshot = await db.collection('userlist').get()

      this.users = snapshot.docs.map(doc => doc.data())
    },
    search(){
      firebase.firestore().collection("userlist").where("displayName", "==", this.searchTerm).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.users.push(doc.data())          
        })})
    },



    updateFriendList(){
      //-----フレンド情報の更新（申請者一覧と新規フレンド一覧をそれぞれ取得）-----
    firebase.firestore().collection("userlist").where("displayName", "==", this.auth.displayName).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.mydocid = doc.id
          //申請者の確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('applicant').orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                  this.messages.push(change.doc.data());
                }
                if (change.type === "modified") {
                  const aid = change.doc.id;
                  // 編集されたドキュメントのidをもつ場合にのみ、if文が稼働
                  const index = this.messages.findIndex(message => message.id === aid);
                  if (index !== -1) {            
                    //Vueの仕様として、配列の特定のインデックスに値を設定しても、検知されないことがある。
                    //よって、提供されている特殊なメソッドを使って、正しくVueに変更を検知してもらう必要がある。
                    //そのメソッドが、Vue.set(this.set)とArray.spliceの2種
                    this.$set(this.messages, index, change.doc.data());
                  }
                }
              })
            });
          //新規フレンドの確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('friend')
            .onSnapshot(snapshot =>  {
              snapshot.docChanges().forEach(change => {
                const data = change.doc.data()
                this.friends.push(change.doc.data())
                this.friendName = data.name               
              })
            });
        })
      })
    },
    getFriendStatus() {
      // フレンドのステータスを保存しているパスを指定して参照を取得
      const friendStatusRef = firebase.database().ref("status/" + this.friendName);

      // フレンドのステータスを取得
      friendStatusRef.on("value", (snapshot) => {
        const status = snapshot.val();
        this.isStatus = status;
      });
    },

    toProfile(data) {
      this.friendids = data.friendId;
      this.$router.push({ path: '/user', query: { user_id: this.friendids } });
    },

    //個人部屋への移行
    async toPairRoom(pairName) {
      await firebase.firestore().collectionGroup('friend').where("name", "==", pairName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            this.pairRoomId = data.pairRoomId;
          });
        });
      this.$router.push({ path: '/PairRoom', query: { room_id: this.pairRoomId } });
    },

    //フレンド申請の承諾
    async acceptFriendRequest(friendInfo) {
      this.value = true;
      const userListRef = firebase.firestore().collection("userlist");

      // 自分宛てへのフレンド申請者情報が格納されたdoc.idを取得
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
          this.status = false
          
        })
      
      // 合意後ルーム生成処理
      // ペアルーム向けに設定した部屋情報をfirestoreに渡す
      const roomRef = firebase.firestore().collection('rooms');

      await roomRef.add({
        createAt: firebase.firestore.Timestamp.now(),
        roomParameter: "friendRoom",
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
        // 相手のdocidを取得
      await userListRef.where("displayName", "==", friendInfo.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            this.parterDocId = doc.id;
          });
        });
      // 相手側もフレンドリスト情報更新
      await userListRef.doc(this.parterDocId).collection('friend').add({
        friendId: this.auth.uid,
        name: this.auth.displayName,
        photoURL: this.auth.photoURL,
        pairRoomId: this.createdRoomId
      });
    },

    async rejectFriendRequest(friendInfo) {
      
      const userListRef = firebase.firestore().collection("userlist");

      await firebase.firestore().collectionGroup('applicant').where("name", "==", friendInfo.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => { 
            this.applicantDocId = doc.id;
          });
        })

        // 受信一覧のリクエストを非表示
      await userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
        status: "on"
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
  .cardbox{
    margin: auto;
    padding: auto;
    width: 300px;
  }
  </style>