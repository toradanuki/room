<template>
  <v-app>
    <div>
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6"> 
            <v-text-field
              v-model="searchTerm"
              append-icon="mdi-magnify"
              label="ユーザー検索"
              single-line
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-list dense>
              <v-list-item
                v-for="user in filteredUsers"
                :key="user.id"
                class="py-2"
              >
                <v-list-item-content class="align-center">
                  {{ user.displayName }}
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn color="primary" @click="friendApply(user.displayName)">フレンド申請する</v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-container>
    </div>
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
                            <v-badge dot :color="data.friendStatus == true ? 'green' : '#808080'" overlap>  
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
                            <v-btn depressed rounded text @click="toProfile(data,index)">個人ページに移動する</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"閉じる" }}</v-btn>
                          </div>
                        </v-list-item-content>
                      </v-card>
                    </v-menu>
                    <v-btn @click="applyPartner(data.name)" v-if="!data.partner && !data.partnerApplicant && !self ">パートナー申請</v-btn>
                    <v-btn @click="acceptPartner(data.name)" v-if="data.applicant && btnIsValid">同意する</v-btn>
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

import firebase from "@/firebase/firebase"

export default {
  data: () => ({
  messages: [],
  cards: ["受信一覧"],
  friends: [],
  friendName:"",
  auth: null,
  status:"true",
  onlineStatus:"",
  roomId: "",
  friendids:"",
  userDocId:"",
  myuserid: "",
  mydocId: "",
  pairRoomId: "",
  isStatus:"",
  names: "",
  btnIsValid:"true",
  self:"",
  searchTerm: '',
  afterClick:true,
  users: [],
  data:[]
  }),
  components: { },

  async mounted() {
    this.auth = JSON.parse(localStorage.getItem("user"));
    this.fetchUsers();
    this.updateFriendList();
    // Vueのテンプレート内で非同期メソッドを直接呼び出すことは推奨されていない、予期せぬエラーに繋がるため
    // よってテンプレート内ではデータを呼び出す形式にすることで、正常な動作を期待する
    const self = await this.hasPartnerOrApplicant()
    this.self = self
  },
  computed: {
    // ユーザーの検索
    filteredUsers() {
      if (!this.searchTerm) {
      return null;
      } else { 
      // 同じ文字で開始するユーザー名を検索候補として返す
      return this.users.filter(user => {
      // ユーザー名と検索語をひらがなに変換
      const userName = user.displayName.normalize("NFKC").toLowerCase();
      const searchTerm = this.searchTerm.normalize("NFKC").toLowerCase();

      return userName.startsWith(searchTerm);
        })
      }
    },
  },
  methods: { 

    friendApply(applyName){
      this.afterClick = false
      firebase.firestore().collection("userlist").where("displayName", "==",applyName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {  
            this.userDocId = doc.id
            const  userRef =firebase.firestore().collection('userlist').doc(this.userDocId)
            //相手のフレンド申請受信リストドキュメントに、自身のユーザー情報を格納
            userRef.collection('applicant').add({         
                createdAt: firebase.firestore.Timestamp.now(),        
                candidate:this.auth.uid,
                name: this.auth.displayName,
                photoURL: this.auth.photoURL,
                status:"off" ,
            })         
          });
        })      
    },
    async hasPartnerOrApplicant() {
      const db = firebase.firestore();
      const userRef = db.collection('userlist');

      // 自分のドキュメントを取得
      const myDoc = await userRef.where('displayName', '==', this.auth.displayName).get();
      if (!myDoc.empty) {
        const myData = myDoc.docs[0].data();
        console.log(myData.partner,myData.partnerApplicant,"testt")

        return myData.partner || myData.partnerApplicant;  
      }
      return false;
    },

    async applyPartner(partnerName) {
      this.self = true
      const db = firebase.firestore();
      const userRef = db.collection('userlist');

      // 自分のドキュメントを取得
      const myDoc = await userRef.where('displayName', '==', this.auth.displayName).get();
      if (!myDoc.empty && myDoc.docs[0].data().partner) {
        return false; // パートナーが既に存在する場合は処理を中断
      }

      // パートナーのドキュメントを取得
      const partnerDoc = await userRef.where('displayName', '==', partnerName).get();
      if (partnerDoc.empty || (partnerDoc.docs[0].data().partner)) {
        
        return false; // パートナーが存在しない、またはパートナーが既に存在する場合は処理を中断
      }

       // パートナーのドキュメントに申請者の名前が既に存在する場合は処理を中断
      if (partnerDoc.docs[0].data().partnerApplicant === this.auth.displayName) {   
        window.alert("既に申請済みです");
        return false;
      }

      // パートナーのドキュメントに申請者の名前を追加
      await userRef.doc(partnerDoc.docs[0].id).update({
        partnerApplicant: this.auth.displayName
      });
    },
    async acceptPartner(partnerName) {
      this.btnIsValid = false;
      const db = firebase.firestore();
      const userRef = db.collection('userlist');

      // 自分のドキュメントを取得
      const myDoc = await userRef.where('displayName', '==', this.auth.displayName).get();
      if (myDoc.empty) {
        return; // 自分のドキュメントが存在しない場合は処理を中断
      }

      // パートナーのドキュメントを取得
      const partnerDoc = await userRef.where('displayName', '==', partnerName).get();
      if (partnerDoc.empty) {
        return; // パートナーのドキュメントが存在しない場合は処理を中断
      }
      // 自分とパートナーのドキュメントを更新
      await userRef.doc(myDoc.docs[0].id).update({
        partner: partnerName,
        partnerApplicant: firebase.firestore.FieldValue.delete() // 申請者の名前を削除
      });
      await userRef.doc(partnerDoc.docs[0].id).update({
        partner: this.auth.displayName
      });

      const partnerRef = db.collection('partner');
      const newPartner = {
      partner0: this.auth.displayName,
      partner1: partnerName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await partnerRef.add(newPartner);
      } catch (error) {
        console.error('Error adding new partner: ', error);
      }
    }, 
    
    async isApplicantExists(partnerName) {
      const db = firebase.firestore();
      const userRef = db.collection('userlist');

      // 自分のドキュメントを取得
      const myDoc = await userRef.where('displayName', '==', this.auth.displayName).get();
      if (!myDoc.empty) {
        return myDoc.docs[0].data().partnerApplicant === partnerName;
      }
      return false;
    },

    // ユーザーリストを読み込む
    async fetchUsers() {
      const db = firebase.firestore()
      const snapshot = await db.collection('userlist').get()
      this.users = snapshot.docs.map(doc => doc.data())
    },
    // 検索結果を確定
    search(){
      firebase.firestore().collection("userlist").where("displayName", "==", this.searchTerm).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.users.push(doc.data())          
        })
      })
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
                    //Vueの仕様として、配列の特定のインデックスに値を設定しても、検知されないケース有
                    //対策として、Vue.set(this.set)とArray.spliceの2種
                    this.$set(this.messages, index, change.doc.data());
                  }
                }
              })
            });
          //新規フレンドの確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('friend')
          .onSnapshot(async snapshot =>  {
            const changes = snapshot.docChanges();
            // forEachは非同期処理を待たずに処理が進行するので、mapに切り替える。
            const friends = await Promise.all(changes.map(async change => {
              const data = change.doc.data();
              this.friendName = data.name;
              const fulfilled = await this.getFriendStatus();
              if(this.onlineStatus == 'online'){
                this.$set(data,'friendStatus',true);
                console.log("success",fulfilled);
              }
              const isApplicant = await this.isApplicantExists(data.name);
              if (isApplicant) {
                this.$set(data, 'applicant', true);
              }
              return data;
            })
            );
            this.friends.push(...friends);
          });
        })
      })
    },
    async getFriendStatus() {
      // フレンドのステータスを保存しているパスを指定して参照を取得
      const friendStatusRef = firebase.database().ref("status/" + this.friendName);
      // onはリアルタイムリッスンにつき、プロミスを返さない
      // よって非同期に対応した、1度だけ取得するonceメソッドに切り替え
      await friendStatusRef.once("value", (snapshot) => {
        const status = snapshot.val();
        this.onlineStatus = status
        return true
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
  .center-input {
  display: flex;
  justify-content: center;
}
  .search-field {
  width: 10px; 
  height: 10px; 
}
.short-width {
  width: 50%; 
}
.bordered-input {
  border: 1px solid blue; 
  border-radius: 5px; 
}
.input-margin {
  margin-top: 40px; 
}
  </style>