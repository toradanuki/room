<template>
  <div>
  <!-- <v-app> -->
    <!-- <app></app> -->
    <!-- <v-row justify="center"> -->
      <!-- <div class="text-center"> -->
        <!-- <v-progress-circular v-if="waitingKey" indeterminate color="primary"></v-progress-circular> -->
      <!-- </div> -->
     
            <!-- <v-btn @click="onStartMatching" class="mx-2"  dark large color="cyan" >
            マッチング
            <v-icon dark>mdi-pencil</v-icon>
          </v-btn> -->

          <!-- <v-btn
      :disabled="dialog"
      :loading="dialog"
      class="white--text"
      color="purple darken-2"
      @click="dialog = true"

    > -->

    <!-- <v-progress-circular
      right
      top
      v-if="afterclick"
      :value="4"
      :size="70"
      :width="7"
      :rotate="360"
    >
     待機中
    </v-progress-circular> -->

    <v-dialog
      v-model="dialog"
     
      persistent
      width="300"
    >
    <!-- hide-overlay ダイアログ表示中に他の操作を受け付け、背景をそのまま表示するプロパティ -->

    <!--v-slot:activator, ダイアログとボタンを親子にする書き方、通常のように分ける場合は記述不要、昔の・・？ -->
    <template v-slot:activator="{ on, attrs }">
        <v-btn
        :disabled="dialog || afterClick"
      :loading="dialog"
      class="white--text"
      color="purple darken-2"
      @click="onStartMatching"
      
          v-bind="attrs"
          v-on="on"
        >
        <v-icon dark>mdi-pencil</v-icon>



      マッチングを開始する
    </v-btn>
    </template>
    <!-- <v-dialog
      v-model="dialog"
      hide-overlay
      persistent
      width="300"
    > -->
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

  <!-- </v-row> -->


<!-- マッチング相手を確認したら、matchAlert = trueとなり次のステップに、そのダイアログを基に次の手続きを開始する  -->
    <v-dialog v-model="matchAlert" max-width="290" persistent>
      <v-card>
        <v-card-title class="text-h5">{{ matchingMesseage }}</v-card-title>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- ここが今のトラブル、ボタンテキスト後から普通渡せないのでは？ほかはjoin表記おかしい？普通にjoinでいいのでは？Toka -->
          <!-- @click="buttonText ='参加を表明する' ? join() : oncancel()" -->
          <v-btn :disabled="isvalid" :color="buttonColor" text @click="join">{{ buttonText }}</v-btn>
          <!-- <v-progress-circular v-if="buttonText === '待機中'" indeterminate color="primary"></v-progress-circular> -->
        <v-progress-linear :value="progress" color="primary"  />
        </v-card-actions>
      </v-card>
    </v-dialog>
<!-- </v-app> -->
</div>
</template>

<script>
import firebase from 'firebase';

export default {
  data: () => ({
    loader: null,
    dialog: false,
    matchAlert: false,
    name: "",
    file: null,
    isvalid:false,
    tests:"",
    status: "start matching",
    buttonColor: 'green darken-1',
    buttonText: '参加を表明する',
    progress: 0,
    createdRoomId: "",
    countdown: 30,
    intervalId: null,
    entryRoomId: "",
    joinRoomId: "",
    unsubscriber:"",
    afterClick:"",
    hostServer: "",
    valid: true,
    matchingMesseage: "",
    waitingKey:"",
    timeSelect:"",
  }),
  created() {
    //ボタン押下から30秒以内は、マッチングボタンを無効にする
    const lastClickedTime = localStorage.getItem('lastClickedTime');
    //個々危ういのかも・
    if (lastClickedTime && Date.now() - lastClickedTime < 30000) {
      this.afterClick = true;
      setTimeout(() => {
        //値－でどうなる？
        this.afterClick = false;
        //セットタイムアウト（０）でfalseできてない可能性もあり。
        //なら最小時間mintimeを１として設定もしや。あんまりわかってないからね
      }, Math.max(30000 - (Date.now() - lastClickedTime), 0));
    }
    else(this.afterClick = false)
  },



  mounted() {
  },
  methods: {




    test(){
      // console.log("fdsf")
    },
    onCancel() {
    this.dialog = false;
    clearInterval(this.intervalId);
    this.roomDelete();
    //ローカル書き直し
    // localStorage.setItem('lastClickedTime', Date.now());
    localStorage.removeItem('lastClickedTime');
    this.afterClick = false

    //多分処理遅いからアウト見たい

    
  
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
    console.log("部屋が正常に削除されました");
  })


  },




  //マッチング完了後のダイアログでの参加部屋振り分け処理。
    async join() {
      //参加表明ボタン、処理の続き
      // this.countdown = 30;
      this.isvalid = true
      this.buttonColor = 'grey';
      // this.$set(this.buttonText, index, newMessage);

      console.log("ボタン確認1",this.buttonText);

      //多分ここらへんのデータのやり取りができてない、例のset案件か？？
      // this.$set(this, 'buttonText', '待機中');
      // this.buttonText = '待機中';
   


      console.log("ボタン確認2",this.buttonText);


      const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus');
 ParameterRef.get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    if (doc.data().roomParameter === 1) {
      console.log("roomParameterは1です");
      // roomParameterが1なら、2に変えて3に編集されるのを待つ
      ParameterRef.doc(this.hostServer).update({
        roomParameter: 2
      }).then(() => {
        // roomstatusが3に変わるのを待つ
         ParameterRef.doc(this.hostServer).onSnapshot((doc) => {
          if (doc.data().roomParameter === 3) {

 


   //リンク保存しときます,右に格納したい実体かな。
    // セッションストレージにcheckInKeyを格納
    sessionStorage.setItem('checkInKey', 'key');
            this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });
            console.log("2の値が3に代わりました、先参加待機勢です")
            clearInterval(this.intervalId);


  



           
          }
          
        });
      });
    } else  {
      


      // roomParameterが2なら、3に変えて参加
      ParameterRef.doc(doc.id).update({
        roomParameter: 3
      }).then(() => {
        // ルーティング処理
        // セッションストレージにcheckInKeyを格納
    sessionStorage.setItem('checkInKey', 'key');
        this.$store.commit('setUrl', this.createdRoomId)
        this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });
        console.log("2の値を3に変えて後から参加します")
        clearInterval(this.intervalId);
      });
    }
  });
}).catch((error) => {
  console.log("Error getting documents: ", error);
});
    },

    //タイマーまず直す、開始時刻→相手確認のダイアログ変更2次タイマー時、残り時間が途中から、リセットしましょうなので。
    //恐らくクライアントとホストどちらもかと。
    


    async onStartMatching() {

      //30秒以内のボタン押下を無効にする。自分自身とマッチングを防止する
      //セッションストレージでなくローカルストレージに時刻を保存することで、他のウィンドウ、タブ
      //再接続時の時間の消失を防ぐ。
      localStorage.setItem('lastClickedTime', Date.now());
      this.afterClick = true;
      setTimeout(() => {
        this.afterClick = false;
      }, 30000);
      // マッチング開始の処理をここに書く






      //2連続のマッチング手続き備えて、タイマーの中身をリセットする
      this.countdown = 30

      //多分ここらへんが元凶くさい、join処理やのにここ絡ませてるから
      //不具合連発かなと。。buttonTextぐちゃぐちゃ？
      //タイマーがどうにかなったら？内部で切り損ねたら？変動かなと・・
      //カウント=0を付けるべきかもなぁ。

      //なんとか外部からthis.countdown弄って、正常のままタイマー復元できました。。。よかった・・
      //あとは参加表明時の文字化けの修正と、戻るボタン30秒後押せない現象の解消かな、、ながかた・・

      
      this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
        
        this.progress = ((30 - this.countdown) / 30) * 100;
        //elseから条件確定してみた。。でも何が変わったかわかりません、、うーん怖いかもなぁ。。この多重分岐。。
      } else if (this.countdown  === 0) {
        this.dialog = false;
        this.matchAlert = false;
        clearInterval(this.intervalId);

        //マッチング失敗ダイアログの表示
        // this.isvalid = true
        //あとはボタンを何とか復活させるだけ？おとなしく他のやつ表示でよさそうやわ。。


        this.matchingMesseage = "マッチングがキャンセルされました。"
        this.buttonText = "戻る"

        this.roomDelete();

        //それか不親切やけどこれで区切りも手段ですか。。。ちかれた。。


        // this.buttonColor = 'green darken-1'
        // this.matchAlert = true

        //30秒の前に部屋が不意に削除されてしまってる説あるかも。
        //多分あるな、elseでいっしょくたやから、内部的に削除されてる
        //もしかすると上手く使えるかもしれんが、今は極めて危険かもこれ。
        //確かに条件よーわからんもんな、滞在なくせても危険おもうわ一旦やめとこや
        //現にエラー多発中

        // progressが0になったら部屋を削除
       // 作成した部屋を削除する

      }
    }, 1000);
      
  


//自動インデックス作成サジェストがコンソール似て出現、グループの次の新規指定で出現なのかも？

    
      const roomRef = firebase.firestore().collection('rooms')

     
//作成されて30秒以内、かつルームステータス情報をもつマッチングルームの最新のものの
//"サブコレクションID"を一つ取得する、時間で範囲指定しつつ

const now = firebase.firestore.Timestamp.now();
const thirtySecondsAgo = new firebase.firestore.Timestamp(now.seconds - 30, now.nanoseconds);

await firebase.firestore().collectionGroup('roomstatus')
  .orderBy('createdAt', 'desc')
  .startAt(now)
  .endAt(thirtySecondsAgo)
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // console.log(doc,"やた")
      const roomParameter = doc.data().roomParameter;
      // console.log(roomParameter,doc.id)
      if (roomParameter == 0) {
        // this.tests = doc.id
        this.hostServer = doc.id
        // console.log(this.hostServer)
        
        // 親ドキュメントのIDを取得
      const mainDocId = doc.ref.parent.parent.id;
      this.joinRoomId = mainDocId
      this.createdRoomId = mainDocId
      // console.log(mainDocId)


        return;
      }
      //できたできたdocidずれてただけかい！

    });
  });


      //client側の処理、待機中の部屋があった場合
      if (this.hostServer) {
          //待機中の部屋 = 最も作成日時が新しいものが十分条件につき、降順(desc,)にソートし一つだけ部屋情報を取得
          
          //※日時における降順→新しい順番。日がたつほど、年,月,日,時刻の各値が大きくなるため。
          //descending ≒decrease,減少順として覚えやすいかも

        //参加する部屋のステータスを変更することで、部屋を閉ざしつつ相手にクライアントの参加をつたえる。
        const roomParameterRef = roomRef.doc(this.joinRoomId).collection('roomstatus').doc(this.hostServer)
        return roomParameterRef.update({
          roomParameter: 1
        })
          .then(() => {
              this.matchingMesseage = "参加可能な部屋が見つかりました。"
              this.matchAlert = true
              
              // localStorage.message = "クライアントとして部屋に参加しました！"
              
          })
       
      }

      //host側の処理、自身が部屋を作成
      else {
        this.waitingKey = true
        //設定した部屋情報をfirestoreに渡す
        roomRef.add({
          createAt: firebase.firestore.Timestamp.now(),
        })
        //自身が作成した部屋のdoc.idを取得

        //ここ念のために、=createAtで検証したほうがいいかも。あれ？てかこれずれでcreate"d"Atの方じゃなかた？
        //どやろそろえる・？？
        const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()
        roomIdRef.forEach(doc => {
          this.createdRoomId = doc.id
          
        })

        //一つ下の階層に、ルームステータスを設定(編集検知→参加、の処理フロー組み込む上で、領域分離が必要なため)
        roomRef.doc(this.createdRoomId).collection('roomstatus').add(
          {
            roomParameter: 0,
            createdAt: firebase.firestore.Timestamp.now()
          })
          //addメソッドはPromiseを返し、そのPromiseは新しく作成されたドキュメントの参照を含む。
          .then((docRef) => {
  console.log("Document written with ID: ", docRef.id);
  this.hostServer = docRef.id

})
        
        const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus')

        //change.type === "modified"であれば、部屋に合流


        ParameterRef.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
        
            if (change.type === "modified" && change.doc.data().roomParameter === 1)
            {
             
              console.log("確認",change.doc.data(),this.createdRoomId,change.id)
                
                this.matchingMesseage = "新たな参加者を確認しました!"
                this.countdown = 30
                //タイマーの時刻をリセット
                this.matchAlert = true


                //先に試しでおいてみる、他のみます。。
      const nowTime = firebase.firestore.FieldValue.serverTimestamp();
const docRef = firebase.firestore().collection('rooms').doc(this.createdRoomId);


  docRef.get().then(() => {
  
   docRef.update({ workStartAt: nowTime }); // updateメソッドを使用
  console.log("時間をセット")} )
                
                // localStorage.message = "ホストとして部屋に参加しました！"

                // this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } })
            }
         
          });
        })

        //こっから別で、復帰用リンク？をとりあえずvuexとかに保持しなあかんのかも、自身のマッチングルームリンクを持たせて
        //そのリンク、部屋が有効の間は→強制的にその部屋にログイン後飛ばす、？？んで他の操作を禁ずる？？
        //ルームパラメーターが4完結とか、部屋がどちらかの合意などで正式に閉ざされるまで？
        //そやな、これも必要やったもんね。離脱からの復帰推奨と、安易な離脱対策。
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