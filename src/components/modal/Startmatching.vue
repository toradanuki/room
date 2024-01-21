<template>
  <div>
    <v-dialog v-model="dialog" persistent width="300">
      <template v-slot:activator="{ on, attrs }">
        <v-btn :disabled="dialog || afterClick" :loading="dialog" class="white--text" color="purple darken-2" @click="onStartMatching" v-bind="attrs" v-on="on">
          <v-icon dark>mdi-pencil</v-icon>
          マッチングを開始する
        </v-btn>
      </template>
      <v-card color="primary" dark>
        <v-card-text>
          参加者を待機中 残り {{ countdown }}秒
          <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" @click="onCancel">中断する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="matchAlert" max-width="290" persistent>
      <v-card>
        <v-card-title class="text-h5">{{ matchingMesseage }}</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :disabled="isvalid" :color="buttonColor" text @click="join">{{ buttonText }}</v-btn>
          <v-progress-linear :value="progress" color="primary" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import firebase from 'firebase';

export default {
  data: () => ({
    dialog: false,
    matchAlert: false,
    isvalid:false,
    buttonColor: 'green darken-1',
    buttonText: '参加を表明する',
    progress: 0,
    createdRoomId: "",
    countdown: 30,
    intervalId: null,
    joinRoomId: "",
    afterClick:"",
    hostServer: "",
    valid: true,
    matchingMesseage: "",
    waitingKey:"",
  }),

  created() {
    //ボタン押下から30秒以内は、マッチングボタンを無効にする
    const lastClickedTime = localStorage.getItem('lastClickedTime');
    if (lastClickedTime && Date.now() - lastClickedTime < 30000) {
      this.afterClick = true;
      setTimeout(() => {
        this.afterClick = false;
      }, Math.max(30000 - (Date.now() - lastClickedTime), 0));
    }
    else(this.afterClick = false)
  },

  mounted() {
  },
  methods: {
    onCancel() {
    this.dialog = false;
    clearInterval(this.intervalId);
    this.roomDelete();
    localStorage.removeItem('lastClickedTime');
    this.afterClick = false
  },
    roomDelete(){
      // 作成した部屋を削除する
      const roomRef = firebase.firestore().collection('rooms').doc(this.createdRoomId);
      const roomStatusRef = roomRef.collection('roomstatus');

      // サブコレクション内のすべてのドキュメントを取得
      roomStatusRef.get().then(snapshot => {
        snapshot.forEach(doc => {
          // 各ドキュメントを削除
          doc.ref.delete();
        });
      });
      // ドキュメント自体を削除
      roomRef.delete().then(() => {
      })
    },

 // マッチング完了後のダイアログでの参加部屋振り分け処理。
  async join() {
    // 参加表明ボタン、処理の続き
    this.isvalid = true
    this.buttonColor = 'grey';

    const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus');
    ParameterRef.get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.data().roomParameter === 1) {
          ParameterRef.doc(this.hostServer).update({
            roomParameter: 2
          }).then(() => {
            // チャット途中離脱の2回目マッチング時、保有可能性があるので（＋テスト環境便宜・？、まだ組み込めてないのでしっかり）
            localStorage.removeItem('oneHourReported', 'true');
            localStorage.removeItem('halfHourReported', 'true');

            ParameterRef.doc(this.hostServer).onSnapshot((doc) => {
              if (doc.data().roomParameter === 3) {
                // セッションストレージにcheckInKeyを格納
                localStorage.setItem('checkInKey', 'key');
                this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });

                clearInterval(this.intervalId);
              }
            });
          });
        } else {
          // roomParameterが2なら、3に変えて参加
          ParameterRef.doc(doc.id).update({
            roomParameter: 3
          }).then(() => {
            // ルーティング処理
            // セッションストレージにcheckInKeyを格納
            localStorage.removeItem('oneHourReported', 'true');
            localStorage.removeItem('halfHourReported', 'true');
            localStorage.setItem('checkInKey', 'key');
            this.$store.commit('setUrl', this.createdRoomId)
            this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });
            clearInterval(this.intervalId);
          });
        }
      });
    })
  },

  async onStartMatching() {
    // 30秒以内のボタン押下を無効にする。自分自身とマッチングを防止する
    // セッションストレージでなくローカルストレージに時刻を保存することで、他のウィンドウ、タブ再接続時の時間の消失を防ぐ。
    localStorage.setItem('lastClickedTime', Date.now());
    this.afterClick = true;
    setTimeout(() => {
      this.afterClick = false;
    }, 30000);

    this.countdown = 30

    this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;

        this.progress = ((30 - this.countdown) / 30) * 100;
      } else if (this.countdown === 0) {
        this.dialog = false;
        this.matchAlert = false;
        clearInterval(this.intervalId);

        this.matchingMesseage = "マッチングがキャンセルされました。"
        this.buttonText = "戻る"

        this.roomDelete();
      }
    }, 1000);
      
    const roomRef = firebase.firestore().collection('rooms')
    const now = firebase.firestore.Timestamp.now();
    const thirtySecondsAgo = new firebase.firestore.Timestamp(now.seconds - 30, now.nanoseconds);

    // 作成されて30秒以内の部屋を参照

    await firebase.firestore().collectionGroup('roomstatus').orderBy('createdAt', 'desc').startAt(now).endAt(thirtySecondsAgo).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const roomParameter = doc.data().roomParameter;
          if (roomParameter == 0) {
          // 親ドキュメントのIDを取得
          const mainDocId = doc.ref.parent.parent.id;
          this.hostServer = doc.id
          this.joinRoomId = mainDocId
          this.createdRoomId = mainDocId
          }
        });
      });

      // client側の処理、待機中の部屋があった場合
      if (this.hostServer) {
        // 待機中の部屋 = 最も作成日時が新しいものが十分条件につき、降順(desc,)にソートし一つだけ部屋情報を取得
        // 参加する部屋のステータスを変更することで、部屋を閉ざしつつ相手にクライアントの参加をつたえる。
        const roomParameterRef = roomRef.doc(this.joinRoomId).collection('roomstatus').doc(this.hostServer)
        return roomParameterRef.update({
          roomParameter: 1
        })
        .then(() => {
            this.matchingMesseage = "参加可能な部屋が見つかりました。"
            this.matchAlert = true
        })
      }
      // host側の処理、自身が部屋を作成
      else {
        this.waitingKey = true
        // 設定した部屋情報をfirestoreに渡す
        roomRef.add({
          createAt: firebase.firestore.Timestamp.now(),
        })
        // 自身が作成した部屋のdoc.idを取得
        // ※脆弱性あり
        const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()
        roomIdRef.forEach(doc => {
          this.createdRoomId = doc.id
        })

        // 一つ下の階層に、ルームステータスを設定(編集検知→参加、の処理フロー組み込む上で、領域分離が必要なため)
        roomRef.doc(this.createdRoomId).collection('roomstatus').add({
            roomParameter: 0,
            createdAt: firebase.firestore.Timestamp.now()
          })
          // addメソッドはPromiseを返し、そのPromiseは新しく作成されたドキュメントの参照を含む。
          .then((docRef) => {
            this.hostServer = docRef.id
          })
          const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus')
          ParameterRef.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "modified" && change.doc.data().roomParameter === 1){
                this.matchingMesseage = "新たな参加者を確認しました!"
                this.countdown = 30
                this.matchAlert = true
                const nowTime = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = firebase.firestore().collection('rooms').doc(this.createdRoomId);
                docRef.get().then(() => {
                docRef.update({ workStartAt: nowTime }); // updateメソッドを使用
                })
              }
          });
        })
      }
    }    
  }
}
</script>

<style scoped>
.mx-2 {
  margin-top:30px;
  margin-right:300px;
}
.card{
  margin-top:30px;
}
.p{
  color:rgb(255, 255, 255);
  font-size: smaller;
  font-family:serif;
  margin-top:8px;
}
</style>