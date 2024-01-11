<template>
  <div>
  <!-- <v-app> -->
    <!-- <app></app> -->
    <!-- <v-row justify="center"> -->
      <!-- <div class="text-center"> -->
        <!-- <v-progress-circular v-if="waitingKey" indeterminate color="primary"></v-progress-circular> -->
      <!-- </div> -->
     
            <v-btn @click="onStartMatching" class="mx-2"  dark large color="cyan" >
            マッチング
            <v-icon dark>mdi-pencil</v-icon>
          </v-btn>

          <!-- <v-btn
      :disabled="dialog"
      :loading="dialog"
      class="white--text"
      color="purple darken-2"
      @click="dialog = true"

    > -->

    <v-dialog
      v-model="dialog"
     
      persistent
      width="300"
    >
    <!-- hide-overlay ダイアログ表示中に他の操作を受け付け、背景をそのまま表示するプロパティ -->

    <!--v-slot:activator, ダイアログとボタンを親子にする書き方、通常のように分ける場合は記述不要、昔の・・？ -->
    <template v-slot:activator="{ on, attrs }">
        <v-btn
        :disabled="dialog"
      :loading="dialog"
      class="white--text"
      color="purple darken-2"
      @click="onStartMatching"
      
          v-bind="attrs"
          v-on="on"
        >



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

    <v-dialog v-model="matchAlert" max-width="290">
      <v-card>
        <v-card-title class="text-h5">{{ matchingMesseage }}</v-card-title>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :disabled="isvalid" :color="buttonColor" text @click="buttonText ='参加を表明する' ? join : null">{{ buttonText }}</v-btn>
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
    hostServer: "",
    valid: true,
    matchingMesseage: "",
    waitingKey:"",
    timeSelect:"",
  }),
  // watch: {
  //     dialog (val) {
  //       if (!val) return

  //       setTimeout(() => (this.dialog = false), 4000)
  //     }},

  // サーバー有無の確認処理を、mountでなくmatching押下の段階で行えるようにすること。
  //厳密にはモーダルのonsubmit。
  mounted() {
  },
  methods: {
    test(){
      // console.log("fdsf")
    },
    onCancel() {
    this.dialog = false;
    clearInterval(this.intervalId);

    //作成した部屋を削除する
    const roomRef = firebase.firestore().collection('rooms')

    roomRef.doc(this.createdRoomId).delete().then(() => {
  console.log("部屋が正常に削除されました");
})


  },


  //マッチング完了後のダイアログでの参加部屋振り分け処理。
    async join() {
      //参加表明ボタン、処理の続き
      this.buttonColor = 'grey';
      this.buttonText = '待機中';

      //値が2にはかわってる、申請前に。ジョイン前に、、なにこれ。

      //createdroomidの受け渡しできてないだけでしたがちなえだり、。はあぁこれエラーコード特定やな、、
      //行数わかったら一発やったやろうな、、あー今後どうするか、開発効率段違いやろこれで。・。
      //まあ設計方法悪勝ったのは認めます、、、一気に作りこんだやつ、エラー原因特定にあまりにも時間かかる、
      //指数関数的に原因の数が増えてしまうからね、大きな開発テストなしで行うとな。。はい、、
      //すいませんでした。。きつ。。。

      // const roomRef = firebase.firestore().collection('rooms')

    

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
    //  this.$store.commit('setUrl',this.createdRoomId )
     console.log("vuexテスト",this.$store.state.url)
    
    
            this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });
            console.log("2の値が3に代わりました、先参加待機勢です")
          }
          
        });
      });
      //やっとここまで動作確認、、、だりいぃい。。
    // } else if (doc.data().roomParameter === 2) {
    } else  {
      console.log("はなくそ")

      //ここが一生通らんくそ。

      // roomParameterが2なら、3に変えて参加
      ParameterRef.doc(doc.id).update({
        roomParameter: 3
      }).then(() => {
        // ルーティング処理
        this.$store.commit('setUrl', this.createdRoomId)
     console.log("vuexテスト",this.$store.state.url)
        this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } });
        console.log("2の値を3に変えて後から参加します")
      });
    }
  });
}).catch((error) => {
  console.log("Error getting documents: ", error);
});

      


      

      



      //parameterを１追加してあげる。

      //パラメーターが相手から追加されて３になったら？いや普通にmodifyedの例のやつ
      //使い回しでいいか、それ検知したら→↓のプッシュ開始か
      //でもまてよ、相手が先に参加表明したら、自分の意思に反して移動してしまう。
      //ならあかんのか。ボタンを押して始めて→相手が賛成してるかのデータを参照
      //もしまだなら→ここでやっと変更検知に移る
      //んでなかったら→クローズと（部屋削除）
      //そうすると。ボタン押したらまずどっちみちデータ変更かも。
      //相手先押しならそのまま移動はできるが。まあこっちのほうが早い？
      //いやmodifed検知なら。いや工数変わらんか、先索引でいいわ。
      //んで変化なかったらおとなしくデータかえて→modifed待機だけ、でええわ
      //うんどっちでもいいみたいかな。

      //あとはこれが逆側も成立するか確認作業やね


      // if (this.joinRoomId) {
      //   this.$router.push({ path: '/chat', query: { room_id: this.joinRoomId } })
      // }
      // else {
      //   this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } })
      // }
    },

    testMatching(){
      // this.dialog = true;
      

    //   this.intervalId = setInterval(() => {
    //   if (this.countdown > 0) {
    //     this.countdown--;
        
    //     this.progress = ((30 - this.countdown) / 30) * 100;
    //   } else {
    //     this.dialog = false;
    //     this.matchAlert = false;
    //     clearInterval(this.intervalId);
    //   }
    // }, 1000);


    },


    async onStartMatching() {


      this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
        
        this.progress = ((30 - this.countdown) / 30) * 100;
      } else {
        this.dialog = false;
        this.matchAlert = false;
        clearInterval(this.intervalId);

        //マッチング失敗ダイアログの表示
        this.isvalid = true
        this.matchingMesseage = "マッチングがキャンセルされました。"
        this.buttonText = "戻る"
        this.buttonColor = 'green darken-1'
        this.matchAlert = true


        // progressが0になったら部屋を削除
    roomRef.doc(this.createdRoomId).delete().then(() => {
      console.log("部屋が正常に削除されました");


    }).catch((error) => {
      console.error("部屋の削除中にエラーが発生しました: ", error);
    });




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
        this.tests = doc.id
        this.hostServer = doc.id
        console.log(this.hostServer)
        
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

    
  


        

        //壊れてるみたい、通常部屋が最新作成だと→おわる、no docupdate,つまりこれ対象にいれたらあかん、
        //いややり方かえなあかんのか、どないする、最新＋クエリ？

      //client側の処理、待機中の部屋があった場合
      if (this.hostServer) {
          //待機中の部屋 = 最も作成日時が新しいものが十分条件につき、降順(desc,)にソートし一つだけ部屋情報を取得
          
          //※日時における降順→新しい順番。日がたつほど、年,月,日,時刻の各値が大きくなるため。
          //descending ≒decrease,減少順として覚えやすいかも

        // const docIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()

        // docIdRef.forEach(doc => {
        //   this.joinRoomId = doc.id
          
        // })

        //参加する部屋のステータスを変更することで、部屋を閉ざしつつ相手にクライアントの参加をつたえる。
        const roomParameterRef = roomRef.doc(this.joinRoomId).collection('roomstatus').doc(this.hostServer)
        return roomParameterRef.update({
          roomParameter: 1
        })
          .then(() => {
              this.matchingMesseage = "参加可能な部屋が見つかりました。"
              this.matchAlert = true
              
              localStorage.message = "クライアントとして部屋に参加しました！"
              this.testMatching()
          })

          //次にまた30秒待機モーダルか、自分の参加表明ボタン→押下、＋相手の参加再表明の通信待ちの画面設計
          //30秒以内にどちらかの表明なしで→参加手続き取りやめ、＋一応両方で作成した部屋の削除処理かな、
          //ある程度の軽量化（ if(room)  {delete}は回しとこか)
          //んで両方参加表明で→やっとrouterpush、ここにはもうダイアログは不要やろう。
          //そのまま部屋にgoかな。
       
      }

      //host側の処理、自身が部屋を作成
      else {
        this.waitingKey = true
        //設定した部屋情報をfirestoreに渡す
        roomRef.add({
          // name: this.name,
          // thumbnailUrl: thumbnailUrl,
          createAt: firebase.firestore.Timestamp.now(),
          // roomParameter: 1,
          // contents:this.contentsSelect,
          // time:this.timeSelect
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

        //あーここもかえなあかんのかも？
        //1→確認ダイアログ、次３の編集まで待機で→routerpusjボタンやもんな。・。
        //2段階検知難しいなら、クライアント側でそこから完結？？んん

        //逆から整理。まずmodify単体は無理、2段階検知あってまあここでつかえんことないけど、
        //つかわんほうが近道みたい
        //んでお互い参加表明待機モーダル入ったら、基本は同じ手続き
        //ただ検知、初期値１，相手が後から入ったとき、データかえてくれないと先賛成側検知できない
        //なら結局どっちもデータかえなかんわけで、既に2なら→3に変える必要ある、ここ難しいのかも
        //同じ値変化無理やから、先側賛成→a 後側→bとする必要、なので変える値を順序に応じて
        //条件分岐が必要なんやね。なるほど、でもそれならmodiいけそうか

        //どうやらホスト側ここから機能していない、値は確かに1に変わってたもんね。やり取りミス？
        //モーダルも確認、データ形式も、docChangesではある。＝＝３つがアウトなんかい？ようわかてない

        ParameterRef.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
        
            if (change.type === "modified" && change.doc.data().roomParameter === 1)
            {

              //一生発火してしまうこれ、、あんさぶすくしなあかんのか？
              //それかchangetypeを常に御しておくのがきけん、絶対あかんのかも？？どやろ
              //あと、最後だけ取得できてました。やはり表記ミスやったか
              console.log("確認",change.doc.data(),this.createdRoomId,change.id)
                
                this.matchingMesseage = "新たな参加者を確認しました!"
                this.matchAlert = true
                localStorage.message = "ホストとして部屋に参加しました！"

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