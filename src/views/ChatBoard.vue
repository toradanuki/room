<template>
  <v-app id="inspire">
    <SidebarSum />

    <!-- 入室時のダイアログ -->
    <v-dialog v-model="checkInDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ status }}</span>
          {{ statusMessages }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="greeting"
            :rules="[v => !!v || '挨拶を入力してください。', v => (v && v.length <= 10) || '挨拶は10文字以下で入力してください']"
            label="あいさつ" required v-if="stepIndex == 0" rows="1"
          ></v-textarea>
          <v-textarea
            v-model="contents"
            :rules="[v => !!v || '作業内容を入力してください。', v => (v && v.length <= 20) || '作業内容は20文字以下で入力してください。']"
            label="作業内容" required rows="1"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="submit">送信する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 作業終了時のダイアログ -->
    <v-dialog v-model="checkOutDialog" persistent max-width="600px" transition="dialog-bottom-transition">
      <v-card class="pa-4" color="pink lighten-5">
        <v-card-title class="headline text-uppercase" style="color: #FF5252; font-size: 24px;">
          お疲れさまでした！
        </v-card-title>
        <v-card-text style="color: #FF5252; font-size: 18px;">
          解禁機能:フレンド申請、詳細プロフィール参照、個人チャット機能
          このまま部屋に残って作業を続けるか、作業を終えるか選択できます。
          継続申請をすることで、相手との作業を継続できます。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="breakUpDialog=true" large depressed>退出</v-btn>
          <v-btn color="green darken-1" text @click="stay" large depressed>続ける</v-btn> 
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 解散確認ダイアログ -->
    <v-dialog v-model="breakUpDialog" persistent max-width="600px" transition="dialog-bottom-transition">
      <v-card class="pa-4" color="pink lighten-5">
        <v-card-title class="headline text-uppercase" style="color: #FF5252; font-size: 24px;">
          {{ breakUpDialogTitle }}
        </v-card-title>
        <v-card-text style="color: #FF5252; font-size: 18px;">
          {{ breakUpDialogBody }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="isListener ? exit() : breakUp()" large depressed>解散</v-btn>
          <v-btn color="green darken-1" text @click="stay" v-if="sender" large depressed>続ける</v-btn> 
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- リメイク時のプログレスバー -->
    <v-dialog v-model="remakeAlert" max-width="290" persistent>
      <v-card>
        <v-card-title class="text-h5">部屋をリメイク中</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-progress-linear :value="progress" color="primary" />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-main>
      <h3></h3>

      <!-- 解散ボタンの表示 -->
      <v-card v-if="oneHourReported" max-width="300" outlined shaped>
        <v-btn @click="confirmBreakUp">解散する</v-btn>
      </v-card>
      <!-- タイマー -->
      <v-progress-circular right top :value="timerValue" :size="70" :width="7" :rotate="360">
        {{ Math.floor(remainingSeconds / 60) }}分{{ remainingSeconds % 60 }}秒
      </v-progress-circular>

      <!-- チャットエリア -->
      <v-container class="py-8 px-6" fluid>
        <v-row>
          <v-col v-for="(card) in cards" :key="card" cols="12">
            <v-card>
              <v-subheader></v-subheader>
              <div class="chat-window">
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <v-list-item :key="index">
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
                              <v-btn v-if="!isMyMessage(data)" :disabled="!oneHourReported" depressed rounded text @click="handleClick(data, index)">
                                {{ isFriend(data) ? '個人チャットに移動する' : 'フレンドを申請する' }}
                              </v-btn>
                              <v-divider class="my-3" v-if="!isMyMessage(data)"></v-divider>
                              <v-btn depressed v-if="!isMyMessage(data)" @click="toProfile(data,index)" :disabled="!oneHourReported && !isMyMessage(data)" rounded text>プロフィールを参照する</v-btn>
                              <v-divider class="my-3" v-if="!isMyMessage(data)"></v-divider>
                              <v-btn depressed rounded text>閉じる</v-btn>
                            </div>
                          </v-list-item-content>
                        </v-card>
                      </v-menu>
                      <!-- メッセージ部分の記述 -->
                      <v-list-item-content>
                        <v-row>
                          <v-col cols="11">
                            <div class="text-caption">{{ data.createdAt }}</div>
                            <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
                          </v-col>
                          <v-col cols="1">
                            <v-btn v-if="data.remakeOption && !isMyMessage(data)" @click="remakeAgree">リメイクする</v-btn>
                            <v-btn icon v-if="!(isMyMessage(data) && (data.heartStatus === 'grey' || data.heartStatus === false))" :class="{ 'heart-button': !(data.heartStatus === 'red' && isMyMessage(data)) }">
                              <v-icon :color="data.heartStatus === 'red' ? 'red' : 'grey'" @click="isMyMessage(data) ? null : toggleHeart(data)">mdi-heart</v-icon>
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-list>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <!-- チャット画面要素以上 -->
      <v-textarea v-model="body" :disabled="!oneHourReported" append-icon="mdi-comment" class="mx-2" :label="handleTextFormLabel()" rows="3" auto-grow></v-textarea>
      <v-btn icon :disabled="false"></v-btn>
      <v-btn class="mr-4" type="submit" @click="submit" :disabled="submitInvalid">送信する</v-btn>
      <v-btn @click="clear">削除する</v-btn>
      <v-btn v-if="restartBtn" @click="remakeApply">再開申請</v-btn>
      <v-chip v-if="chip4" class="ma-2" close color="orange" label outlined @click:close="chip4 = false">早速挨拶をして、作業を開始しましょう。</v-chip>
    </v-main>
  </v-app>
</template>

<script>
import firebase from "@/firebase/firebase";
import SidebarSum from "@/components/layouts/SidebarSum.vue";
// import { mapState } from 'vuex';

export default {
  data: () => ({
    dialog: false,
    checkInDialog: false,
    statusMessages:"マッチングが成立しました。作業内容を入力して、最初の挨拶をしましょう！",
    messages: [],
    timerValue:100,
    intervalId:null,
    chip4: true,
    isListener:false,
    halfHourReported:"",
    oneHourReported:"",
    remainingSeconds:5000,
    join: true,
    checkOutDialog:"",
    breakUpDialog:"",
    myUserListId:"",
    restartBtn:false,
    mydocid:"",
    wasInactive: false,
    date:"",
    remakeAlert:"",
    friendids:"",
    greeting:"",
    contents:"",
    heartStatus:false,
    progressIntervalId:"",
    userDocId: "",
    progress:"",
    status:"入室",
    auth: null,
    body: "",
    remakeApplyDocId:"",
    roomId: "",
    applyName: "",
    countdown: 5,
    stepIndex:0,
    textAreaStatus:"作業終了までメッセージ機能を停止中",
    cards: ["Today"],
    breakUpDialogTitle:"解散手続き",
    breakUpDialogBody:"記録は削除されます、本当に解散しますか？",
    sender:"",
  }),
  computed: {
    
    // テキストフォームが空の時は送信ボタンを無効にする(valid ↔ invalid,無効)
    submitInvalid() {
      if (!this.body) {
        return true;
      }
      return false;
    }
  },
  beforeDestroy() {
    // コンポーネントが破棄される前にタイマーを停止
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },
  created() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },
  async mounted() {

    this.auth = this.$store.state.user
    this.auth = JSON.parse(sessionStorage.getItem('user'));
    this.roomId = this.$route.query.room_id;

    // デプロイ環境ではローカルストレージ変更検討
    this.listenBreakUp();
    this.remakeListen();
    this.setTimer();
    this.observeMessagesAndGet();
  },
  
  methods: {

    confirmBreakUp(){
      this.sender = true
      this.breakUpDialog = true
    },

    async isFriend(opponentData){
      let result = false;
      await firebase.firestore().collection("userlist").where("displayname", "==", this.auth.displayname).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
      
        this.myUserListId = doc.id
        const friendListSnapshot =  firebase.firestore().collection('userlist').doc(this.myUserListId).collection('friends').where('name', '==', opponentData.name).get();
        result = !friendListSnapshot.empty;
        
        });
      });
      return result
    },

    // 自分のメッセージであれば、ハートボタン無効+常にハート表示
    isMyMessage(data) {
      if(this.auth.uid == data.userId){
        return true;
      }
    },
    async handleClick(data, index) {
    const isFriend = await this.isFriend(data);
    if (isFriend) {
      this.toFriendRoom(data.name);
    } else {
      this.FriendApply(index);
    }
  },
    startTimer() {

      // 60分間のルーム進行を管理

      // 既存のタイマーがあればリセット
      if (this.intervalId) {
        clearInterval(this.intervalId);
      
      }
      
      this.oneHourReported = sessionStorage.getItem('oneHourReported');
      this.halfHourReported = sessionStorage.getItem('halfHourReported');

      if(!this.oneHourReported){

      this.intervalId = setInterval(() => {
        this.remainingSeconds -= 1;
        this.timerValue = (this.remainingSeconds / 3600) * 100;

        if (0 <= this.remainingSeconds && this.remainingSeconds <= 1800 && !this.halfHourReported) {
          // 挨拶の必須項目を解除
          this.join = false;
          // ダイアログの状態管理

        sessionStorage.setItem('halfHourReported', 'true');
        //一応データの方も
        this.halfHourReported = true;
          this.statusMessages = "30分が経過しました、進捗を入力しましょう";
          this.status = "進捗";
          this.checkInDialog = true;
        }
        if (this.remainingSeconds <= 0 ){
        clearInterval(this.intervalId);
          this.join = false;
          this.stepIndex = 2;
          this.statusMessages = "1時間が経過しました";
          this.status = "活動終了";  
          this.checkInDialog = true;
        }
      }, 1000);
    }
  },
    handleVisibilityChange() {
      // ページがアクティブに切り替われば、タイマー再起動

      if (document.visibilityState === 'hidden') {
        this.wasInactive = true;
      } else if (document.visibilityState === 'visible' && this.wasInactive) {
        this.setTimer();
        this.wasInactive = false;     
      }
    },
    remakeCountDown(){
      this.remakeAlert = true
      this.progressIntervalId = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
          this.progress = ((30 - this.countdown) / 30) * 100;
        } else if (this.countdown  === 0) {  
          clearInterval(this.progressIntervalId);
          location.reload();
        }
      }, 1000);
    },
    
    setTimer() {

      // -----現在時刻とルーム経過時間の差分を取得-----
      const docRef = firebase.firestore().collection('rooms').doc(this.roomId);

      //セッションストレージに格納されたcheckInKeyを参照し、Keyがあればthis.checkInDialog = true
      const checkInKey = sessionStorage.getItem('checkInKey');
      if (checkInKey) {
     this.checkInDialog = true;
      }
      docRef.get().then((doc) => {
        // サーバー側のタイムスタンプを取得する
        const now = firebase.firestore.Timestamp.now().toDate();
        const workStartAt = doc.data().workStartAt.toDate();
        const diffSeconds = Math.floor((now - workStartAt) / 1000);
        const workTimeLeft = Math.floor(60 * 60 - diffSeconds); 
  
        this.remainingSeconds = workTimeLeft
        this.startTimer();
      })
    },

    toFriendRoom(data){
      this.friendids = data.userId
      this.$router.push({ path: '/user', query: { user_id: this.friendids } })
    },
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

    toggleHeart(data) {
      // ハートのカラーを切り替え
      this.heartStatus = this.heartStatus === 'red' ? 'grey' : 'red'; 
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);

      roomRef.collection('messages').doc(data.id).update({ 
        heartStatus: this.heartStatus
      })
    },

    handleTextFormLabel() {
      return this.oneHourReported ? "メッセージを入力する"  : "作業終了までメッセージ機能を停止中"
    },
    exit(){
      this.$router.push('/');
    },
    listenBreakUp(){
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      roomRef.onSnapshot((docSnapshot) => {
        if (!docSnapshot.exists) {
          this.isListener = true;
          this.breakUpDialogTitle = "解散通知"
          this.breakUpDialogBody = "相手が解散手続きをしました。部屋を脱退します"
          this.breakUpDialog = true
      
        }
      });
    },
    // 解散確定後の部屋の整理処理
    async breakUp(){
      // ダイアログ編集
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      // messagesコレクションのドキュメントを削除する
      const messagesSnapshot = await roomRef.collection('messages').get();
      messagesSnapshot.forEach(doc => {
        doc.ref.delete();
      });

      // roomstatusコレクションのドキュメントを削除する
      const roomstatusSnapshot = await roomRef.collection('roomstatus').get();
      roomstatusSnapshot.forEach(doc => {
        doc.ref.delete();
      });

      // roomsコレクションのドキュメントを削除する
      await roomRef.delete();
            
      //相手に退出を告知、(部屋を削除？)、ルータプッシュでリンクの移動
      this.$router.push('/');
    },

    // 1時間経過後のダイアログ滞在処理
    stay(){
      //タイマーの再開、処理をはじめからやり直し
      this.checkOutDialog= false
      this.breakUpDialog = false
      this.restartBtn = true
    },

    async remakeApply(){

      const roomRef =await firebase.firestore().collection('rooms').doc(this.roomId);
        //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').add({ 
        message: "延長申請", 
        name: this.auth.displayname,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false,
        remakeOption:1
        })
      this.scrollToBottom();
    },

    remake(){
      
      //部屋情報初期化
      sessionStorage.removeItem('oneHourReported', 'true');
      sessionStorage.removeItem('halfHourReported', 'true');
      sessionStorage.setItem('checkInKey','true');

      // リメイクカウントダウンタイマー
      this.remakeCountDown();
    },
    remakeListen(){
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
      const messagesRef = roomRef.collection('messages');

      // メッセージの変更をリアルタイムに監視
      messagesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            if (data.remakeOption === 2) {
              // remakeOptionが2に変更された場合、該当のデータを削除
              messagesRef.doc(change.doc.id).delete();
              this.remake();
            }
          }
        });
      });
    },

    remakeAgree(){
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
      // リメイク承諾処理
      roomRef.collection('messages').doc(this.remakeApplyDocId).update({ 
        remakeOption:2
      })
      .then(() => {
        //開始時刻を更新
        const nowTime = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = firebase.firestore().collection('rooms').doc(this.roomId);

        docRef.get().then(() => {
        docRef.update({ workStartAt: nowTime }); // updateメソッドを使用
        })
        this.remake();
      })
    },
    clear() {
      this.body = "";
    },
    scrollToBottom() {
      const chatWindow = document.querySelector('.chat-window');
      chatWindow.scrollTop = chatWindow.scrollHeight;
    },

    // 作業データを個人記録に保存
    async contentsRecord() {
      
      // dataを相応しい形式で取得
      let today = new Date();
      let yyyy = today.getFullYear();
      let mm = String(today.getMonth() + 1).padStart(2, '0'); // 月のインデックスは０につき１を加える
      let dd = String(today.getDate()).padStart(2, '0');

      let dateString = `${yyyy}-${mm}-${dd}`;
      this.date = dateString

      await firebase.firestore().collection("userlist").where("displayname", "==", this.auth.displayname).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            this.mydocid = doc.id
          })
        })

      const userRef = await firebase.firestore().collection('userlist').doc(this.mydocid)
      userRef.collection('records').add({
        createdAt: firebase.firestore.Timestamp.now(),
        time: "00:30",
        contents: this.contents,
        date: this.date,
      })
    },
    submit() {

      this.checkInDialog = false
      this.scrollToBottom();
      
      //通常時のメッセージデータの格納
      let messagedata = this.body;
      //入室時のモーダル形式に内容すり替え
      if (this.contents) {
        messagedata = this.greeting + this.contents;
      }
      this.handleDataBeforeSubmit();

      //送信者の情報、メッセージ内容をアップロードする

      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
      roomRef.collection('messages').add({
        message: messagedata,
        name: this.auth.displayname,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false
      })
      .then(() => {
        this.body = "";
        this.greeting = "";
        this.contents = "";
      })
      .catch(() => {
        alert('メッセージの送信に失敗しました。')
      })
    },
    handleDataBeforeSubmit() {
      
      sessionStorage.removeItem('checkInKey');
    
      if (!this.join) {
        this.contentsRecord();
      }
      //※stepIndexローカル保存につき脆弱性あり
        if (this.stepIndex === 2) {
          // お疲れ様モーダルの表示と特定の処理
          this.stepIndex = null;
          this.checkOutDialog = true;
          this.textAreaStatus = "メッセージを入力してください"
          this.oneHourReported = true;

          sessionStorage.setItem('oneHourReported', 'true'); 
        }
      },   
    observeMessagesAndGet(){

      // メッセージデータの分類と習得

      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
      roomRef.collection('messages').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach( change => {
            // messages配列へ特定用id属性の付与
            const newMessage = {
              id: change.doc.id,
              ...change.doc.data()
            };

          // newMessageのcreatedAtをDateオブジェクトに変換
          const createdAtDate = new Date(newMessage.createdAt.seconds * 1000);

          // DateオブジェクトをYYYY/MM/DD/HH/MM形式の文字列に変換
          // padStartで、1桁であれば先頭に'0'を追加
          const formattedCreatedAt = `${createdAtDate.getFullYear()}
          /${(createdAtDate.getMonth() + 1).toString().padStart(2, '0')}
          /${createdAtDate.getDate().toString().padStart(2, '0')} 
          ${createdAtDate.getHours().toString().padStart(2, '0')}
          :${createdAtDate.getMinutes().toString().padStart(2, '0')}`;

          // newMessageのcreatedAtを更新
          newMessage.createdAt = formattedCreatedAt;

          // 追加メッセージがリメイク申請であれば、そのdocIdを取得
          if (change.type === 'added' && newMessage.remakeOption === 1){
            this.remakeApplyDocId = newMessage.id
            this.messages.push(newMessage);
          }
          // 通常のメッセージであれば、メッセージとして反映
          else if (change.type === 'added') {
            this.messages.push(newMessage);
          } 
          // 対象データのインデックスを取得
          else if (change.type === 'modified') {
            const index = this.messages.findIndex(message => message.id === newMessage.id);
            // リメイク承諾であれば、リメイクを実施
            if (index !== -1 && newMessage.remakeOption === 2){
              this.remake();
            }
            // 'いいね'を検知
            else if (index !== -1) {
              //プロパティをリアクティブに更新するメソッド$set
              this.$set(this.messages, index, newMessage);
            }   
          }
        });
      });
    },
    
    async FriendApply(index){
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
      let dataArr = [];
      await roomRef.collection('messages').orderBy('createdAt','asc').limit(index+1).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            dataArr.push(doc.data());
          })
          const  data2 =dataArr[index]
          const{name}=data2
          this.applyName = name
        })

      //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得
      firebase.firestore().collection("userlist").where("displayname", "==",this.applyName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {  
            this.userDocId = doc.id
            const  userRef =firebase.firestore().collection('userlist').doc(this.userDocId)
            //相手のフレンド申請受信リストドキュメントに、自身のユーザー情報を格納
            userRef.collection('applicant').add({ 
                createdAt: firebase.firestore.Timestamp.now(),        
                candidate:this.auth.uid,
                name: this.auth.displayname,
                photoURL: this.auth.photoURL,
                status:"off" ,
                opponentName:this.applyName
              })
          });
        })
    }
  },
  components: { SidebarSum,  }
}
</script>

<style>
.message {
  text-align: left;
  white-space: pre-wrap;
}
.chat-window {
  height: 400px; 
  overflow-y: auto; /* 垂直方向のスクロール */
}
.heart-button {
  visibility: hidden;
}

.v-list-item:hover .heart-button {
  visibility: visible;
}
</style>