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
                <v-list-item :key="index" v-if="data.status == 'off' && status ">
                  <!-- v-if="data.status == 'off' || status == true" -->
                  <!-- ここからmenu実装 -->
                  <!-- <v-menus v-model="menuIndex"> -->
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
                          <!-- <v-list-item-avatar color="grey darken-1"> -->
                            <v-badge dot :color="isStatus === 'online' ? 'green' : '#808080'"
                               overlap>  <template v-slot:badge>
              
              </template>
                              
                              <v-list-item-avatar color="grey darken-1">
                                <v-img :src="data.photoURL"></v-img>
                              </v-list-item-avatar>
                            </v-badge>
                          <!-- </v-list-item-avatar> -->
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
                            <v-btn depressed rounded text @click="getProfile(data,index)">プロフィールを参照する</v-btn>
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
  drawer: null,
  joinmessage: "",
  }),
  components: { SidebarSum },

  mounted() {




//変更してみる。
//null ,gg 他頁だけまだいまいちいけないみたい。

console.log("成功dayonn",this.$store.state.user)
    
    const auth = this.$store.state.user

    console.log("成功da",auth.displayName)
    // JSON.parse(sessionStorage.getItem('user'))
     const { displayname } = auth
    

    this.myuserid = auth.uid
    this.auth = auth
    this.names = displayname

    //フレンド情報の更新（申請者,新規フレンド）
    firebase.firestore().collection("userlist").where("displayname", "==", auth.displayName).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {

          //同意した時に、既存のdomがなぜか変更されないので、そこをまず改修していく、
          //参照データが異なるのかな？messagesとフレンドで扱てること確認。
          //”同意する”、でどんな機能が働いているかやな。データ編集＋検知なら即時反映のはずやが。。
          //格納はされてるみたいやぞ？まあ物理確認もあとでありか

          this.mydocid = doc.id
          //申請者の確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('applicant').orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                console.log("変更データ確認",change.doc.data())
      //           const newMessage = {
      //   id: change.doc.id,
      //   ...change.doc.data()
      // };

                if (change.type === "added") {
        this.messages.push(change.doc.data());}
        if (change.type === "modified") {
          // console.log("変更データ確認エラー",this.messages, index, change.doc.data())

//idが未定義。。。どういうことですか・・？？
//名前かえたらなくなったてこおてゃ。。、const id エラー？
//いやエラー無くなるおかしくないか？何も手違いはないはず。
//なら挙動終わってる認定？Ｗだる

//結局機能しなかったので断念して、ローカルボタンでの閉じにきりかえ
//はあ時間かけすぎた、まじで最後までわからんの珍しかったわ。。類似やったのにね。。・・・くそ。。

        const aid = change.doc.id;
        // 編集されたドキュメントのidをもつ場合にのみ、if文が稼働
        const index = this.messages.findIndex(message => message.id === aid);
        if (index !== -1) {
          console.log("変更データ確認2",this.messages, index, change.doc.data())
          
          //Vueの仕様として、配列の特定のインデックスに値を設定しても、検知されないことがある。
          //よって、提供されている特殊なメソッドを使って、正しくVueに変更を検知してもらう必要がある。
          //そのメソッドが、Vue.set(this.set)とArray.spliceの2種
          this.$set(this.messages, index, change.doc.data());

        }
                //ん？これおかしいのかも？
                //取得対象全域push..?of→onになったやつもとってきてないか？どこでオフにしてるんやそもそも？てか
                //消した方がいいのでは？ｗ→再申請嫌ってやっけかｗすでにあるなら→無理、とか想定してたっけなｗ

                //v-if="data.status == 'off'"確認。これ即時反映ちゃうくさない？
                //んで重複もしそうなんよな。おんであれば描画しませんいうてるけど、v-ifってリアクティブちゃうかったような？
                //いやvならええんやっけか
                
                //なんかええみたいやぞ。すると足りないのは。該当箇所のデータの挿入でなく入れ替えかな。いいね機能みたいな
                //多分その場で変更元のデータもそのまま一時的に格納されるのがdocchagesやったおもうので。

                //それに倣うと、追加系→そのままプッシュ、編集系→任意の処理でわける、ここやとログ残したいなら
                //値編集してpushをしないこと。うんそれで多重ログ滞在現象防げるはず。多分疎やろこれやろか

                //消えなかった。既存データをオンに変更。再起でデータ消失、つまり１、更新データ取得→２，描画に移れているので
                //今何ができていない。１できてないんか。疑似取得で、代入ができていないんやわ、既存の配列messagesに
                //ならmodifedで、配列の番号にonもったデータ格納やね
      }
      else{console.log("whatfuk")}
              })
            });
          //新規フレンドの確認
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('friend')
            .onSnapshot(snapshot =>  {
              snapshot.docChanges().forEach(change => {

                const data = change.doc.data()
                
                this.friends.push(change.doc.data())
                this.friendName = data.name
                console.log("フレンドネーム",this.friendName)

                this.getFriendStatus();
              })
            });
            
        })
      })
  },

  methods: {

    getFriendStatus(){
      // フレンドのステータスを保存しているパスを指定して参照を取得
const friendStatusRef = firebase.database().ref("status/" + this.friendName);
console.log("フレンドネーム",this.friendName)

// フレンドのステータスを取得
friendStatusRef.on("value", (snapshot) => {
  const status = snapshot.val();
  console.log("フレンドのステータス: ", status);

  this.isStatus = status




});
    },

    getProfile(data){

      this.friendids = data.friendId

      this.$router.push({ path: '/user', query: { user_id: this.friendids } })


    },



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
      //個々がミソかな。同意した時変わるのはステータス情報のみ。それを果たして検知しているかどうか
      //値pushで取り込んでいるか？それか回す配列入れ替えてるかどうか、処理走ってるか
      await userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
        status: "on"
      })
        .then(() => {
          this.status = false
          
        })
        .catch(() => {
          
        });

      // **オブジェクトも引数としてとれる。そして異なるコンテキスト内でも各要素それぞれドット記法で呼び出せた**
      

      // ここから改修、合意後ルーム生成処理
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
        name: this.auth.displayName,
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