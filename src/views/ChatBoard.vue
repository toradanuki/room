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
          label="あいさつ"
          required v-if="stepIndex == 0"
          rows="1"
        ></v-textarea>
        <v-textarea
          v-model="contents"
          :rules="[v => !!v || '作業内容を入力してください。', v => (v && v.length <= 20) || '作業内容は20文字以下で入力してください。']"
          label="作業内容"
          required
          rows="1"
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
    <v-card  class="pa-4" color="pink lighten-5">
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
        <v-btn color="red darken-1" text @click="exit" large depressed>退出</v-btn>
        <!-- <v-btn color="green darken-1" text @click="stay" large depressed>続ける</v-btn> -->
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 退出ボタン,stepIndex=2で表示でよさそう！退出うけつけ、正式退出処理実装
  ならここに顔アイコン途中から表示どう？？プロフ参照用？わかりにくいかな？レート表示はどう？
画像はあるけどもーー、、まあここ相手顔アイコンで、申請＋参照にしたらわかりやすいかも。・・！ -->
    <v-main>
      <h3></h3>
      <v-card v-if="stepIndex === 3" max-width="300" outlined shaped>
        <v-avatar color="grey lighten-2" size="79">
       <!-- 相手の画像挿入は一応検討！ -->
          <v-img v-if="stepIndex === 3" max-height="123" max-width="250" :src="room.thumbnailUrl"></v-img>
        </v-avatar>
        <v-btn to="/">退出する</v-btn>
      </v-card>
      <v-alert dense type="info" v-if="logstack"></v-alert>

      <!-- タイマー -->
    <v-progress-circular right top :value="timerValue" :size="70" :width="7" :rotate="360">
      {{ Math.floor(remainingSeconds / 60) }}分{{ remainingSeconds % 60 }}秒
    </v-progress-circular>

      <!-- ここからチャット画面要素 -->
      <v-container class="py-8 px-6" fluid>
        <v-row>
          <v-col v-for="(card) in cards" :key="card" cols="12">
            <v-card>
              <v-subheader></v-subheader>
              <div  class="chat-window">
              <v-list two-line>
                <template v-for="(data, index) in messages">
                  <v-list-item :key="index">
                    
                      <v-menu bottom  min-width="200px" rounded offset-y>
                       
                        <template v-slot:activator="{ on }">
                          <v-btn icon x-large v-on="on" >
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
                              <p class="text-caption mt-1"> </p>
                              <v-divider class="my-3"></v-divider>
                              <v-btn v-if="!isMyMessage(data) " :disabled="stepIndex !== 3"  depressed  rounded text @click="FriendApply(index)">
                                フレンドを申請する
                              </v-btn>
                              <v-divider class="my-3"></v-divider>
                              <v-btn depressed @click="toProfile(data,index)" :disabled="stepIndex !== 3 && !isMyMessage(data)"  rounded text>プロフィールを参照する</v-btn>
                              <v-divider class="my-3"></v-divider>
                              <v-btn depressed rounded text>閉じる</v-btn>

                            </div>
                          </v-list-item-content>
                        </v-card>
                      </v-menu>
                    <!-- </v-menus> -->
                    <!-- メッセージ部分の記述 -->
                    <v-list-item-content>
                      <v-row>
        <v-col cols="11">
          <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
        </v-col>
        <v-col cols="1">
           <!-- 自分のもの && 色が無効でボタンを描画しない
            :class="{class名:true}"で、クラス割り当ての条件分岐が可能
           "ハートが赤 && 自分のもの"ならホバークラスを解除して、常に描画をする -->

           <v-btn v-if= data.remakeOption @click="remakeAgree"  >リメイクする </v-btn>
           <v-btn v-if= data.remakeOption @click="remakeCancel"  >辞退 </v-btn>


          <v-btn icon v-if="!(isMyMessage(data) && (data.heartStatus === 'grey' || data.heartStatus === false) )"  
          :class="{ 'heart-button': !(data.heartStatus === 'red' && isMyMessage(data)) }">
          

            <!--  自分のボタンであれば、クリックメソッドを無効にする -->
           <v-icon :color="data.heartStatus === 'red' ? 'red' : 'grey'" @click="isMyMessage(data) ? null : toggleHeart(data)"> mdi-heart</v-icon> 
           <!-- data.heartStatus = 'red' ? 'red' : 'grey' -->

            <!-- <v-icon :color="heartColor ? 'red' : 'grey'" @click="toggleHeartColor(data)"> mdi-heart</v-icon> -->
          </v-btn>
        </v-col>
      </v-row>
                    </v-list-item-content>
                  </v-list-item>
                  <!-- <v-divider v-if="n !== 6" :key="`divider-${index}`" inset></v-divider> -->
                </template>
              </v-list>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <!-- チャット画面要素以上 -->
      <v-textarea v-model="body" :disabled="isDisabled" append-icon="mdi-comment" class="mx-2" :label="textAreaStatus" rows="3" auto-grow>
      </v-textarea>
      <v-btn icon :disabled =false>
            <!-- <v-icon :color="heartStatus ? 'red' : 'grey'" @click="toggleHeart"> mdi-heart</v-icon> -->
            </v-btn>
      <v-btn class="mr-4" type="submit" :disabled="invalid" @click="submit">
        送信する
      </v-btn>
      <v-btn @click="clear">
        削除する
      </v-btn>
      <v-btn v-if="restartBtn" @click="remakeApply">再開申請</v-btn>
      <v-chip v-if="chip4"  class="ma-2" close color="orange" label outlined @click:close="chip4 = false" >
        早速挨拶をして、作業を開始しましょう。
      </v-chip>
    </v-main>
  </v-app>
</template>

<script>
import firebase from "@/firebase/firebase";
import SidebarSum from "@/components/layouts/SidebarSum.vue";
import { mapState } from 'vuex';
// import router from "@/router";
// import MenuBar from '@/components/layouts/MenuBar.vue';

export default {
  data: () => ({
    dialog: false,
    checkInDialog: false,
    statusMessages:"マッチングが成立しました。作業内容を入力して、最初の挨拶をしましょう！",
    messages: [],
    timerValue:100,
      remainingMinutes:1 ,
      dialogVisible: false,
      
    chip4: true,
    halfHourReported:"",
    oneHourReported:"",
    timerCount: 30,
    remainingSeconds:"",
    join: true,
    btn: false,
    logstack: "",
    checkOutDialog:"",
    restartBtn:false,
    isFavorite:true,
    mydocid:"",
    date:"",
    remakeId:"",
    friendids:"",
    greeting:"",
    contents:"",
    heartStatus:false,
    userDocId: "",
    status:"入室",
    roomTime: 30,
    timer: 5,
    auth: null,
    body: "",
    room: null,
    remakeApplyDocId:"",
    roomId: "",
    applyName: "",
    stepIndex:0,
    textAreaStatus:"作業終了までメッセージ機能を停止中",
    cards: ["Today"],
    drawer: null,
    joinmessage: "",
    isDisabled:true,
    links: [
      ["mdi-inbox-arrow-down", "Inbox"],
      ["mdi-send", "Send"],
      ["mdi-delete", "Trash"],
      ["mdi-alert-octagon", "Spam"],
    ],
    user: {},
    return: {
      chip4: true
    }
  }),
  beforeDestroy() {
  // window.removeEventListener('beforeunload', this.handleLeave)
},


  async created() {

    // this.roomId = this.$route.query.room_id;
    // const roomRef = firebase.firestore().collection("rooms").doc(this.roomId);
    // const roomDoc = await roomRef.get();
    // if (!roomDoc.exists) {
    //   await this.$router.push('/');
    // }
    
    // this.room = roomDoc.data();
    
  },
  async mounted() {
   // 1時間のタイマー起動

   //一応セッションストレージにだけ格納、デプロイ環境ならローカルに切り替えかな
const halfHourReported = sessionStorage.getItem('halfHourReported');
const oneHourReported = sessionStorage.getItem('oneHourReported');

if (halfHourReported) {
  this.halfHourReported = halfHourReported === 'true';
  console.log("already done",this.halfHourReported)
}

if (oneHourReported) {
  this.oneHourReported = oneHourReported === 'true';
}

    //クエリパラメータより、滞在中のページを識別し、振り分ける処理。取得したパラメータより
    //適切な内部データを抽出し、単一のviewから個々のページを展開できる。

    this.auth = this.$store.state.user
    this.auth = JSON.parse(sessionStorage.getItem('user'));

    this.roomId = this.$route.query.room_id;
    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

    this.setTimer();

    //実装検討、難しいそうなら取捨選択で諦める。
    //プロフィールのみ、直接コレクションとして保存しない、常に一意かつ可変のものとして扱うために
    //コレクションに格納するのは、呼び出しのキーにとどめる。そう、代わりにキーを固定にすることで
    //中身が変わっても、都度キーで対応できる。ただ・・？api使用が増える、あーなんとなくわかったかも
    //多分その倉庫別のとこにあって、そこに毎回画像のために問いあわせの必要が出てくるんか。
    //んで今からの改革案やと、直urlアクセスじゃなくて（つまりaddも、セットで取り出しもやめて？)
    //id基に検索ワンクッションやって、んでその取り出したデータをセットで格納
    //なるほど、想定してみればそこまで負担じゃないかもな、データ整形くらいちゃうそれこそ

    // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
    roomRef.collection('messages').orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        //すごｗこんなところにも柔軟にasync適応できるんや。。。ひやー奥深、魅力的すごい。。。
        snapshot.docChanges().forEach( change => {
          // いいね機能に備えた、messages配列へid属性の付与
          const newMessage = {
        id: change.doc.id,
        ...change.doc.data()
      };

      //できませんでした、他人の参照はサーバーサイドでしかできひんみたいです・・
      //なるほどな、するとやはり参照しかないのか。。んで書き換えやるとなると。。
      //各メッセージデータ、プロフィール、フレンドリスト、メニュー。。少なくないよな。。
      //多分手作業みたいやし、断念かな。。。まあかといって画像変更機能消すのもあれやし。。
      //これはクライアント開発やと厳しいもんなんかも・・
        // ユーザーのプロフィール情報を取得します
  // const user =firebase.auth().getUser(newMessage.name);
  // .then( console.log(user))
 

// // ユーザーのプロフィール画像のURLを取得します
// newMessage.photoURL = user.photoURL;









      // 追加メッセージがリメイク申請であれば、そのdocIdを取得

      //一枚処理かませたら処理くっそおそなるまじ？？dom反映
      //これ面白い現象なんやけどさ・・(笑)、ならaddで共有のpush処理して
      //その中でif(remake)あれば格納、でいいかも？
      //そうなんでこんな重くなるか、取得データの分解の検査を前に一回挟むからやと思う。。！
      //なるほどそれ面白いかも・‥！高速化設計そんなところに・・！？
      if (change.type === 'added' && newMessage.remakeOption === 1){
       this.remakeApplyDocId = newMessage.id
       this.messages.push(newMessage);
      }
      // 通常のメッセージであれば、メッセージとして反映
      else if (change.type === 'added') {
        this.messages.push(newMessage);
        console.log("メッセージが追加されました")
      } 
      
   
      // いいね機能、編集されたデータのインデックスを取得
      else if (change.type === 'modified') {
        const index = this.messages.findIndex(message => message.id === newMessage.id);
      // リメイク申請者が、承諾されたことを把握
         if (index !== -1 && newMessage.remakeOption === 2){
          console.log("リメイク処理成立")
          this.remake();
        }
        // 変更を検知したドキュメント=いいね押下されたメッセージ
         else if (index !== -1) {
         
 //プロパティをリアクティブに更新するメソッド$set
 //いいね情報を適切な位置に反映する
          this.$set(this.messages, index, newMessage);
        }   
      }
        });
      });

    if (localStorage.message) {
      this.joinmessage = localStorage.message;
      localStorage.message = '';
    }  
  },

  computed: {
    // vuexの呼び出し記述を少なくする設定
    ...mapState(['remakeId']),
  
    invalid() {
      if (!this.body) {
        return true;
      }
      return false;
    },
   
    // heartColor() {
    //   return this.heartStatus ? 'red' : 'grey';
    // },
  },
  methods: {
    // 自分のメッセージであれば、ハートボタン無効+常にハート表示
    isMyMessage(data) {
      if(this.auth.uid == data.userId)
      {
        return true;
      }
    },
    startTimer() {

      // 60分間のルーム進行を管理

      


    const intervalId = setInterval(() => {
      this.remainingSeconds -= 1;
      this.timerValue = (this.remainingSeconds / 3600) * 100;

      //ここなんか発動してない気がする‥？30分モーダル。。
      //ぴったりの時間にウィンドウ開いてないと、現状発動しないのが２？
      //１はよーわかんね
      if (0 <= this.remainingSeconds <= 1800 && !this.halfHourReported) {
        // 挨拶の必須項目を解除
        this.join = false;
        // ダイアログの状態管理// 
        this.stepIndex = 1;
        this.statusMessages = "30分が経過しました、進捗を入力しましょう";
        this.status = "進捗";
        this.checkInDialog = true;
      }

      if (this.remainingSeconds <= 0 && !this.oneHourReported){
        clearInterval(intervalId);
        this.join = false;
        this.stepIndex = 2;
        this.statusMessages = "1時間が経過しました";
        this.status = "活動終了";  
        this.checkInDialog = true;
      }
    }, 1000);
  },
   setTimer(){

// -----現在時刻とルーム経過時間の差分を取得-----

    // const nowTime = firebase.firestore.FieldValue.serverTimestamp();
const docRef = firebase.firestore().collection('rooms').doc(this.roomId);


//セッションストレージにcheckInKeyを格納

//セッションストレージに格納されたcheckInKeyを参照し、Keyがあればthis.checkInDialog = true
const checkInKey = sessionStorage.getItem('checkInKey');
    if (checkInKey) {
      this.checkInDialog = true;
    }

    //重複問題もあるんやけども・・（なぜか両者作ってしもてる？？）
    //そうか、elseはそもそも非当事者なら処理は知らんかったわ。。ぐうどうしよ、
    //だいぶやっかいかも。
    //時間決定もホストかクライアント、どっちかに任せるべきぽいなぁとかな。。
    //どうしよか。
    //マッチング時、ホストが直前に時間アプデして
    //両方がそれもとにelse文で取得どやろ、うんそれよさげちゃう？？
    //めんどうなのさけれるしやってみよか。roomIdだけ取得でね。

    console.log(`kakunin`,this.roomId);

    
      //なんで動作しない？？
      //コンソール一切機能しないと不思議やけども
      //におうの、部屋へのdoc割り当て中に参照で全部ブロックされてる可能性、はなくはないかも
      //コールバックできてないからね、みてみよかこれ、挙動が珍しいもんね、色々見てきたから感じる

      //まあこれでいいかあああ、、ズレ許容になるけど、わりとしっかり動作してみるみたい、双方向やりとり
      //遅延(ping)と初動のエントリー処理遅延で、非同期組み込みなしでも推定で動くだろうよみでね。。
      //まあええかぁ。ちょっと急ぎということで。。曲がりなりにも動作ほぼ保障となるので・・？
      //まあ厳密な場ではあかんやろうね・・くう。。

 docRef.get().then((doc) => {
  
  // サーバー側でのタイムスタンプを取得する
  const now = firebase.firestore.Timestamp.now().toDate();
  const workStartAt = doc.data().workStartAt.toDate();
  const diffSeconds = Math.floor((now - workStartAt) / 1000);
const workTimeLeft = Math.floor(60 * 60 - diffSeconds); // 60 minutes * 60 seconds
console.log(`Work time left: ${workTimeLeft} seconds`);
// this.remainingMinutes = workTimeLeft;
this.remainingSeconds = workTimeLeft

}).catch((error) => {
  console.log("Error getting document:", error);
});

//うえにasyncawaitで取得まで待機して、個の出力まつ、いい感じ、慣れてるｗ、なんていうんやったけかこれ
//このことも折角なのでふれよう(笑)

this.startTimer();

  },

    threeTimer(){

      //個々一気に見直し。ローカル時刻依存環境と、パラメータ参照制度導入

      //現在のfirebaseの時刻を習得
      
      //取得した時間を、そのままroomsコレクションのフィールドに、"workStartAt"で格納
      //ただし"workStartAt"が既にあれば触らない

      //"workStartAt"を取得する。workTimeLeft = 60minutes-(現在時刻-workStartAt)

      //

      // 'rooms'コレクションからドキュメントを取得

      const nowTime = firebase.firestore.FieldValue.serverTimestamp();
const docRef = firebase.firestore().collection('rooms').doc(this.roomId);


//セッションストレージにcheckInKeyを格納

//セッションストレージに格納されたcheckInKeyを参照し、Keyがあればthis.checkInDialog = true
const checkInKey = sessionStorage.getItem('checkInKey');
    if (checkInKey) {
      this.checkInDialog = true;
    }


docRef.get().then((doc) => {
  if (!doc.data().workStartAt) {
  docRef.update({ workStartAt: nowTime }); // updateメソッドを使用
  console.log("時間をセット")
  this.remainingMinutes = nowTime
} else {
  const now = firebase.firestore.Timestamp.now().toDate();
  const workStartAt = doc.data().workStartAt.toDate();
  const diffSeconds = Math.floor((now - workStartAt) / 1000);
const workTimeLeft = Math.floor(60 * 60 - diffSeconds); // 60 minutes * 60 seconds
console.log(`Work time left: ${workTimeLeft} seconds`);
this.remainingMinutes = workTimeLeft;
}
}).catch((error) => {
  console.log("Error getting document:", error);
});

//ほか残る課題は、30分経過後の復帰と
//31分かつモーダル未入力時の復帰処理かな
//タイマーはなんとかなりそう？うん離脱しても開始時刻から算出するからそれは問題ない。
//現状ぴったり30分区切りでモーダルとか表記やり取りしてるけども
//残り0-30分、かつ経過モーダル未入力→モーダル２表示、内容調整
//0分以下のモーダル３も同様にかな。

const intervalId = setInterval(() => {
// 1秒毎(1000)に値を1/60差し引く、タイマーの基準の値

//個々がくるってる、分表記とごちゃなっとる？
//3000 = 3000- 1/60 なんやこれ。

//コールバック必要かも、先にこっち行われてしまっとるわ、データ受け取れてなかったので。
//うーんまあ違い気になるけど。関数分けるかぁ。
this.remainingMinutes -= 1;

//maxを100にする必要、その割合になるので。なら分子に変数いるかも。。
//あとは表記データの修正よね
this.timerValue = (this.remainingMinutes / 3600) * 100 

//ぎゃああ。。この２このステップインデックスと、？？いやtimeReportedだけか？
//これも再起で消失するから、どっかに保持しなあかんのかいー。だりｗ
//なんかいきなり面倒なってきてない？時間管理の難しさ？ローカルの進捗管理の難しさなんかも、
//何気オンラインでの管理ばっかりやったもんな、そういうことかも。。ぐう。。
//というかそれら考慮すると、穴だらけなんかもなこの設計・・ローカル一つ依存すると、それ思わぬところで
//消失すると、こういう進捗系、進行形は一気に崩れるんやわ。。きつぅ。。。ぐう。。。むじい。。
//多分マッチング30秒もにたようなものちゃう？いやまああれはでも基準点ないからましやったんか。。
//こういった外部３０秒保持かつローカルで進捗管理のときが面倒なんか、、なるほどな。。
//これ体感すると、もういっそすべてサーバーで進捗管理、時間計算が丸い気がしてきたわぁ。。
//ほんとねー。。ぐう。不正とか予想外利用多すぎるもんね。・・

// 0~30分（1800秒）内で経過報告がまだであれば、ダイアログを表示
if (0 <= this.remainingMinutes <= 1800 && !this.halfHourReported) {
  // 初回でないので挨拶の必須項目を解除
  this.join = false
  //ダイアログの状態管理
  this.checkInDialog = true;
  this.stepIndex = 1
    // ダイアログの記述を変更
  this.statusMessages = "30分が経過しました、進捗を入力しましょう"
  this.status = "進捗"
 

 
}

// 1時間（3600秒）経過すれば経過報告モーダルの表示
if (this.remainingMinutes <= 0 && !this.oneHourReported){
  clearInterval(intervalId);

  // 初回でないので挨拶の必須項目を解除
  this.join = false

  // 内容を適切なものに変更しダイアログを表示
  this.statusMessages = "1時間が経過しました"
  this.status = "活動終了"
  this.checkInDialog = true;
  this.stepIndex = 2
  this.textAreaStatus ="メッセージを送信します"
}
}, 1000); // 1秒ごとに処理を行う

}, toProfile(data){

  //多分ここ要修正？普通にidかな？それか
this.friendids = data.userId

this.$router.push({ path: '/user', query: { user_id: this.friendids } })


},
   
    toggleHeart(data) {

     // ハートの点灯状態を切り替え
      this.heartStatus = this.heartStatus === 'red' ? 'grey' : 'red'; 

      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
     
       //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').doc(data.id).update(
    { 
      heartStatus: this.heartStatus
    }
      )
      .then(() => {       
      })
    },
   
    textFormActivate() {
      this.isDisabled = false;
    },
    // 1時間経過後のダイアログ退出処理
    exit(){
      //相手に退出を告知、(部屋を削除？)、ルータプッシュでリンクの移動
      this.checkOutDialog= false

      this.$router.push('/');

    },
    // 1時間経過後のダイアログ滞在処理
   stay(){
    //タイマーの再開、処理をはじめからやり直し
   
    this.checkOutDialog= false
    this.textFormActivate();
    //friendActivate,ほか移動アクティベイトなど、一括関数で行った方がいいかも？関数増えすぎ抑止につき？

    //作業再申請ボタンの表示

    this.restartBtn = true
   } ,
   async remakeApply(){
 
    const roomRef =await firebase.firestore().collection('rooms').doc(this.roomId);
       //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').add(
        { 
        message: "延長申請", 
        name: this.auth.displayname,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false,
        remakeOption:1
        }
      )
      //vuex無理目みたいでしただる・・終わらせたかった今日中に・・
      .then(docRef => {
        this.scrollToBottom();
        console.log("remakeApply Called",docRef.id)

        //多分この周辺処理削除してよさげ
        this.remakeId = docRef.id
        // this.$store.commit('setRemakeId', docRef.id);
})

   },
   remakeAgree(){

    

    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
    // リメイク承諾処理
      roomRef.collection('messages').doc(this.remakeApplyDocId).update(
        { 
        remakeOption:2
        }
      )
      .then(() => {

        this.scrollToBottom();
        console.log("remakeAgree Called")
        //リメイク処理本体

        //タイマーリセットとモーダルリセットで一括で行ってくれてたっけ？？



        // this.threeTimer();



        //f5更新とかのほうが早いかも？それならmounted走らせれるし都合いい？
        //いやそれ同時に欠陥なりかねない‥・？？ええどうやった
        //配置致命的でしたｗどうしよこれ、ｗ
        //入室モーダル系やっかいなんかも？？少なくとも無条件のmountedモーダルはいかんみたいやわ
        //f5や再入室時に再度表示されてしまうので。タイマー再開もそうやろうなまさに。
        //そうすると。初回入室時なら→モーダル表示とタイマー稼働(ルーム情報だよりになるかな、ローカルは色々
        //突発対応に苦労しそう、)んでタイマー継続、リロードで時刻ずれもあかんか。。ここもならグローバル時刻に
        //かも、createdAt取得、30分経過ででもどうする？？これcloudfunctions、サーバー処理案件なりそうなのが
        //こわい。。絶対に保持できる開始時刻があれば問題ないのか。サーバー完結厳しいなら。いや？？
        //開始時刻サーバー格納→入室時に絶対取得、ローカルとグローバル毎分比較？？ああ、時刻基にどのタイミングで
        //再発火が難しいのか、固定セットインターバル30分が、ブラウザ再接続ならきびいから。
        //んでわかった、"セットインターバル時刻を可変"にすればいい。そう、monted毎にfireba
        //あとグローバル時間を使う廃止かな原則。お互いのやりとりタイミングの支障をなくすの大切だから（最後の
        //退出とか、チャット、定刻解禁で、その基準ローカルならやり取りにずれが生じてUX低下免れないから。
        //そう内部時間、大きくずれてるユーザー一人で、一気に崩れかねないので。リスク管理の観点
        //よって、マウント時グローバル時間取得:グローバル格納開始時刻比較、あと内部のstepIndexも参照かな、
        //これはルーム固有グローバル情報か個人のものにするかは未確定やが。そう、ただそれでローカルで時間計算
        //は任せながら正確性担保できる、段階の動機狙える、f5トラブルも避けてね。よしそやなこれいこか。
        //
        this.checkInDialog = true
        
      })


   },
   remake(){
    // this.threeTimer();
    this.checkInDialog = true

   },
   remakeCancel(){
    
    //ボタンは消そうかな。文面をキャンセルされました、に書き換えぐらいでいい？
    //そうか相手にもこれつたえなあかんのかｗ1;1やりとりこういうの結構手間なんやなｗキャンセル一つとっても
    //検知と送信必要なんやわ、、ひええ。。そうかけそうかｗ

   },
    clear() {
      
      this.body = "";
    },
    scrollToBottom() {
      const chatWindow = document.querySelector('.chat-window');
   chatWindow.scrollTop = chatWindow.scrollHeight;

},
async contentsRecord(){

  //入力データを個人記録に保存する処理

  //dataを相応しい形式で取得
  let today = new Date();
let yyyy = today.getFullYear();
let mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero indexed, so we add 1
let dd = String(today.getDate()).padStart(2, '0');

let dateString = `${yyyy}-${mm}-${dd}`;
this.date = dateString

await firebase.firestore().collection("userlist").where("displayname", "==", this.auth.displayname).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.mydocid = doc.id
        })
      })

      const  userRef =await firebase.firestore().collection('userlist').doc(this.mydocid)
              userRef.collection('records').add(
              { createdAt: firebase.firestore.Timestamp.now(),        
                    time: "00:30",
                    contents:this.contents,
                    date: this.date,           
             })
              .then(() => {
              })},

  submit() {

  //初回以外であれば、記録の保存
    !this.join ? this.contentsRecord() : null;
 // 代入した後で、セッションストレージからcheckInKeyを削除
    sessionStorage.removeItem('checkInKey');

   // 2回目の入力完了記録
  if (this.stepIndex === 1) {
    sessionStorage.setItem('halfHourReported', 'true');
   this.halfHourReported = true;
  } else if (this.stepIndex === 2) {
    // お疲れ様モーダルの表示と特定の処理
    this.checkOutDialog = true;
    this.oneHourReported = true;
    sessionStorage.setItem('oneHourReported', 'true');
    this.stepIndex = 3;
  }

      this.checkInDialog =false
  //通常時のメッセージデータの格納
      let messagedata = this.body;
      //もし送信タイプがモーダルであったら、挨拶と作業内容にすり替える
  if ( this.contents) {
    messagedata = this.greeting + this.contents;
  }
      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
       //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').add(
        { 
        message: messagedata, 
        name: this.auth.displayname,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false
        }
      )
      .then(() => {

        this.scrollToBottom();
        this.body = "";
        this.greeting = "";
        this.contents = "";
      })
      .catch(() =>{
        
        alert('メッセージの送信に失敗しました。')
      })
    },

    //フレンド申請処理

    async FriendApply(index){
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
      let dataArr = [];
      await roomRef.collection('messages').orderBy('createdAt','asc').limit(index+1).get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
          //forEachでデータを回して、pushで用意した配列に渡す
            dataArr.push(doc.data());
          })
        //forEach処理を完了させるべく波括弧外に次のデータ受け渡し処理記述
        //配列の中から任意のデータをindexで抽出、配列(配列obj)における分割代入式

          const  data2 =dataArr[index]
          //data2は配列オブジェクトの型につき、キー"name"より値を取得する記述式
          const{name}=data2
          
          //リクエスト申請者の名前を取得
          this.applyName = name
        })

      //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得
      firebase.firestore().collection("userlist").where("displayname", "==",this.applyName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {  

            this.userDocId = doc.id
            const  userRef =firebase.firestore().collection('userlist').doc(this.userDocId)
            //相手のフレンド申請受信リストドキュメントに、自身のユーザー情報を格納
            userRef.collection('applicant').add(
              { 
                 createdAt: firebase.firestore.Timestamp.now(),        
                candidate:this.auth.uid,
                name: this.auth.displayname,
                photoURL: this.auth.photoURL,
                status:"off" ,
                opponentName:this.applyName
              }
            )
            .then(() => {
              
              this.body = "";
            })
          });
        })
        .catch(() => {
        
      });
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
  height: 400px; /* 適切な高さを設定します */
  overflow-y: auto; /* 垂直方向にスクロール可能にします */
}
.heart-button {
  visibility: hidden;
}

.v-list-item:hover .heart-button {
  visibility: visible;
}


</style>

