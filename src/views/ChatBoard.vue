<template>
  <v-app id="inspire">


    <!-- 入室時のダイアログ -->
    <v-dialog v-model="checkInDialog" persistent max-width="600px">
      <v-card>
        <v-form ref="form" v-model="valid" >
      
        <v-card-title>
          <span class="headline">{{ status }}</span>
          {{ statusMessages }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="greeting" v-if="checkInKey"
            :rules="checkInKey ? [v => !!v || '挨拶を入力してください。', v => (v && v.length <= 10) || '挨拶は10文字以下で入力してください'] : []"
            label="あいさつ" :required="checkInKey" rows="1"
          ></v-textarea>
          <v-textarea
            v-model="contents"
            :rules= "[v => !!v || '作業内容を入力してください。', v => (v && v.length <= 20) || '作業内容は20文字以下で入力してください。']"
            label="作業内容" required rows="1"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn  color="green darken-1" text @click="submit" :disabled="isvalid">送信する</v-btn>
        </v-card-actions>
      </v-form>
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
          <v-btn color="green darken-1" text @click="stay" v-if="sender" large depressed>続ける</v-btn> 
          <v-btn color="red darken-1" text @click="isListener ? exit() : breakUp()" large depressed>解散</v-btn>
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
      <template>
        <div class="timer-container">
          <v-progress-circular right top :value="timerValue" :size="120" :width="10" :rotate="360" color="primary">
            <div v-if="remainingSeconds >= 0" style="font-size: 18px; color: #333;">
              {{ Math.floor(remainingSeconds / 60) }}分{{ remainingSeconds % 60 }}秒
            </div>
            <div v-else style="font-size: 18px; color: #333;">
              0分0秒
            </div>
          </v-progress-circular>
        </div>
      </template>
      <!-- チャットエリア -->
      <v-container class="py-8 px-6" fluid>
        <v-row>
          <v-col>
            <v-card>
              <v-subheader></v-subheader>
              <div class="chat-window">
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <v-list-item :key="index">
                      <v-menu bottom min-width="200px" rounded offset-y @input="checkIsFriend(data)">
                        <!-- メッセージアイコンをボタン化 -->
                        <template v-slot:activator="{ on }">
                          <v-btn icon x-large v-on="on">
                            <v-list-item-avatar color="grey darken-1">
                              <v-img :src="data.photoURL"></v-img>
                            </v-list-item-avatar>
                          </v-btn>
                        </template>
                        <!-- ユーザー展開メニュー -->
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
                                {{ data.isFriend ? '個人チャットに移動する' : 'フレンドを申請する' }}
                              </v-btn>
                              <v-divider class="my-3" v-if="!isMyMessage(data)"></v-divider>
                              <v-btn depressed v-if="!isMyMessage(data)" @click="toProfile(data,index)" :disabled="!oneHourReported && !isMyMessage(data)" rounded text>プロフィールを参照する</v-btn>
                              <v-divider class="my-3" v-if="!isMyMessage(data)"></v-divider>
                              <v-btn depressed rounded text>閉じる</v-btn>
                            </div>
                          </v-list-item-content>
                        </v-card>
                      </v-menu>
                      <!-- メッセージ本文 -->
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
      <!-- コントロールパネル -->
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

import chatMixin from '@/mixins/mixin.js';
// import { mapState } from 'vuex';

export default {
  components: {   },
  mixins: [chatMixin],
  data: () => ({
    isMatchingRoom:true,
    dialog: false,
    valid: true,
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
    checkInKey:"",
    roomId: "",
    applyName: "",
    notifyEndKey:"",
    countdown: 5,
    textAreaStatus:"作業終了までメッセージ機能を停止中",
    cards: ["Today"],
    breakUpDialogTitle:"解散手続き",
    breakUpDialogBody:"記録は削除されます、本当に解散しますか？",
    sender:"",
  }), 
  computed: {
    isvalid() {
      return !this.valid;
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

    this.checkOutDialog = false
    this.roomId = this.$route.query.room_id;
    // this.auth = this.$store.state.auth
    this.auth = JSON.parse(localStorage.getItem('user'));
    // パートナーマッチングであれば、異なるキーを持たせる
    this.$store.commit('setRoomId', this.roomId)
    this.oneHourReported = localStorage.getItem('oneHourReported');
    this.halfHourReported = localStorage.getItem('halfHourReported');
    this.checkInKey = localStorage.getItem('checkInKey');
    this.restartBtn = localStorage.getItem('restartBtnKey')

    if (this.checkInKey) {
      this.checkInDialog = true;
    }
    this.listenBreakUp();
    this.remakeListen();
    this.setTimer();
    this.observeMessagesAndGet();
  },
  
  methods: {
    setTimer() {

      // -----現在時刻とルーム経過時間の差分を取得-----
      const docRef = firebase.firestore().collection('rooms').doc(this.roomId);

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

    startTimer() {

      // 60分間のルーム進行を管理
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      // タイマーの実行処理
      if(!this.oneHourReported){
        this.intervalId = setInterval(() => {
        this.remainingSeconds -= 1;
        this.timerValue = (this.remainingSeconds / 3600) * 100;

        if (0 <= this.remainingSeconds && this.remainingSeconds <= 1800 && !this.halfHourReported) {

          // ダイアログの状態管理
          localStorage.setItem('halfHourReported', 'true');
          this.halfHourReported = true;
          this.statusMessages = "30分が経過しました、進捗を入力しましょう";
          this.status = "進捗";
          this.checkInDialog = true;
        }
        if (this.remainingSeconds <= 0 ){
          clearInterval(this.intervalId);
          localStorage.setItem('notifyEndKey', 'true');
          this.statusMessages = "1時間が経過しました。成果を報告しましょう";
          this.status = "活動終了";  
          this.checkInDialog = true;
        }
      }, 1000);
    }
  },
    // 作業データを個人記録に保存
    async workContentsRecord() {
        
        // dataを相応しい形式で取得
        let today = new Date();
        let yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1).padStart(2, '0'); // 月のインデックスは０につき１を加える
        let dd = String(today.getDate()).padStart(2, '0');

        let dateString = `${yyyy}-${mm}-${dd}`;
        this.date = dateString

        await firebase.firestore().collection("userlist").where("displayName", "==", this.auth.displayName).get()
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
    handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        this.wasInactive = true;
      } else if (document.visibilityState === 'visible' && this.wasInactive) {
        this.setTimer();
        this.wasInactive = false;     
      }
    },
  
    handleTextFormLabel() {
      return this.oneHourReported ? "メッセージを入力する"  : "作業終了までメッセージ機能を停止中"
    },

    notifyEndOfSession() {
          this.textAreaStatus = "メッセージを入力してください"
          this.checkOutDialog = true;
          this.oneHourReported = true;
          localStorage.setItem('oneHourReported', 'true'); 
        },
      // ----------- 一時間経過後の継続、解散処理 --------------

      // 1時間経過後のダイアログ滞在処理
    stay(){
      //ステータスの初期化
      this.checkOutDialog= false
      this.breakUpDialog = false
      this.restartBtn = true
    },
    exit(){
      //保存したデータを削除
      this.$router.push('/');
    },

    confirmBreakUp(){
      this.sender = true
      this.breakUpDialog = true
    },

    // 解散時にステータスと部屋を初期化
    async breakUp(){

      this.$store.commit('clearRoomId');
      localStorage.removeItem('oneHourReported');
      localStorage.removeItem('halfHourReported');
      localStorage.removeItem('restartBtnKey')
      localStorage.removeItem('notifyEndKey')
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

      this.$router.push('/');
    },
    listenBreakUp(){
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      roomRef.onSnapshot((docSnapshot) => {
        if (!docSnapshot.exists) {
          this.$store.commit('clearRoomId');
          localStorage.removeItem('oneHourReported');
          localStorage.removeItem('halfHourReported');
          localStorage.removeItem('restartBtnKey')
          localStorage.removeItem('notifyEndKey')
          this.isListener = true;
          this.breakUpDialogTitle = "解散通知"
          this.breakUpDialogBody = "相手が解散手続きをしました。部屋を脱退します"
          this.breakUpDialog = true          
        }
      });
    },

    // ---------------リメイク手続き------------------

    async remakeApply(){

      this.restartBtn = false
      localStorage.removeItem('restartBtnKey')

      const roomRef =await firebase.firestore().collection('rooms').doc(this.roomId);
        //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').add({ 
        message: "延長申請", 
        name: this.auth.displayName,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false,
        remakeOption:1
        })
      this.scrollToBottom();
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

    remake(){

      //部屋情報初期化
      localStorage.removeItem('oneHourReported');
      localStorage.removeItem('halfHourReported');
      localStorage.removeItem('restartBtnKey')
      localStorage.removeItem('notifyEndKey')
      localStorage.setItem('checkInKey','true');

      this.remakeCountDown();
    },

    remakeCountDown(){
      this.remakeAlert = true
      this.progressIntervalId = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
          this.progress = ((5 - this.countdown) / 5) * 100;
        } else if (this.countdown  === 0) {  
          clearInterval(this.progressIntervalId);
          location.reload();
        }
      }, 1000);
    },
  }
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
.timer-container {
  
  justify-content: center;
}
</style>