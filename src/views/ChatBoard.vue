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
      共同作業達成により、レートが＋１されました。
      解禁機能:フレンド申請、詳細プロフィール参照、個人チャット機能
      このまま部屋に残って作業を続けるか、作業を終えるか選択できます。
      継続申請をすることで、相手との作業を継続できます。
      
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="red darken-1" text @click="exit" large depressed>退出</v-btn>
      <v-btn color="green darken-1" text @click="stay" large depressed>続ける</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

 
      






    <v-alert dense text type="success" v-if="this.joinmessage">
      <!-- {{ joinmessage }} -->
    </v-alert>
    <v-main>
      <!-- <h1>{{ room.name ? "ルーム名:" + room.name : "" }}</h1>
      <v-chip v-if="room.time">
        {{ "    " + room.contents + ":残り" + this.roomTime+ "分" }} -->
        <!-- <v-icon right>mdi-clock-time-eight</v-icon>
      </v-chip> -->
      <h3></h3>
      <v-card max-width="300" outlined shaped>
        <v-avatar color="grey lighten-2" size="79">
          <v-img v-if="room" max-height="123" max-width="250" :src="room.thumbnailUrl"></v-img>
        </v-avatar>
        <v-btn to="/">退出する</v-btn>
      </v-card>
      <v-alert dense type="info" v-if="logstack"></v-alert>

      <!-- タイマー -->
    <v-progress-circular
      right
      top
      :value="timerValue"
      :size="70"
      :width="7"
      :rotate="360"
    >
      {{ remainingMinutes-30 }}
    </v-progress-circular>





      <!-- ここからチャット画面要素 -->
      <v-container class="py-8 px-6" fluid>
        <v-row>
          <v-col v-for="(card) in cards" :key="card" cols="12">
            <v-card>
              <v-subheader></v-subheader>
              <!-- この↑の部分の記述不要では。。？恐らくメッセージ画面コンテナ複数用、でも一つでいいはず、cards
              は中身today＋0 を取るだけだからね、うんうん、時間でボックス分けるつもりないし、あーでも送信時刻のせる
              のはありかも。・・？data.timestampをmessageの横に記すのありかも、灰色でね～。 -->
              <div  class="chat-window">

              <v-list two-line>
                <template v-for="(data, index) in messages">
                  <!-- ここのtemplateタグ然り、プロパティ何か与えたいときに取り敢えずディレクティブとしてのtemp..? -->
                  <v-list-item :key="index">
                    <!-- <v-menus> -->
                      <v-menu bottom min-width="200px" rounded offset-y>
                        <!-- v-model="menuIndex"  -->
                        <template v-slot:activator="{ on }">
                          <v-btn icon x-large v-on="on" >
                            <v-list-item-avatar color="grey darken-1">
                              <v-img :src="data.photoURL"></v-img>
                            </v-list-item-avatar>
                          </v-btn>
                        </template>
                        <!-- v-on:イベント名 が基本の使い方、また省略したい時@イベント名、@clickみたく
                        そして暗黙として v-on="{ mousedown: doThis}"の仕様を取るため?、この場合クリック=activatorの
                        イベント発火、この場合だとメニューハンドラにあたる、v-slotアクティベーターのonが発火する→menu展開 -->
                        <!-- ここから独立template activator外れるので、mainの中身実装部分となる -->
                        <v-card>
                          <v-list-item-content class="justify-center">
                            <div class="mx-auto text-center">
                              <v-avatar color="brown">
                                <v-img :src="data.photoURL"></v-img>
                              </v-avatar>
                              <h3>{{ data.name }}</h3>
                              <p class="text-caption mt-1"> </p>
                              <v-divider class="my-3"></v-divider>
                              <v-btn depressed rounded text @click="FriendApply(index)">
                                フレンドを申請する
                              </v-btn>
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
      <v-textarea v-model="body" :disabled="isDisabled" append-icon="mdi-comment" class="mx-2" label="メッセージを送信する" rows="3" auto-grow>
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
    checkInDialog: true,
    statusMessages:"マッチングが成立しました。作業内容を入力して、最初の挨拶をしましょう！",
    messages: [],
    timerValue:100,
      remainingMinutes: 1,
      dialogVisible: false,
      
    chip4: true,
    timerCount: 30,
    join: true,
    btn: false,
    logstack: "",
    checkOutDialog:"",
    restartBtn:false,
    isFavorite:true,
    mydocid:"",
    date:"",
    remakeId:"",
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
    roomId: "",
    applyName: "",
    stepIndex:0,
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

    //ん？？ここ不要ちゃうｋ？this.roomどこにも見当たらないもん。。。
    //なるほど、以前のルームネームとルームタイムの名残みたいやわ
    //まあこの程度なら放置でいいかなそこまで気にならんし。ふむ、次いこかなら
    
    this.roomId = this.$route.query.room_id;
    const roomRef = firebase.firestore().collection("rooms").doc(this.roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      await this.$router.push('/');
    }
    
    this.room = roomDoc.data();
    
  },
  async mounted() {
    this.auth = this.$store.state.user

    this.threeTimer();

    



     
  //  this.scrollToBottom();

    // const userStatusDatabaseRef = firebase.database().ref('/status/' + this.userId);
    // const userStatusFirestoreRef = firebase.firestore().doc('/status/' + this.userId);

    // firebase.database().ref('.info/connected').on('value', (snapshot) => {
    //   if (snapshot.val() == false) {
    //     return;
    //   }

    //   userStatusDatabaseRef.onDisconnect().remove().then(() => {
    //     userStatusDatabaseRef.set(firebase.database.ServerValue.TIMESTAMP);
    //     userStatusFirestoreRef.set({ status: 'online' });
    //   });
    // });
 




    // window.addEventListener('beforeunload', this.handleLeave);


    //クエリパラメータより、滞在中のページを識別し、振り分ける処理。取得したパラメータより
    //適切な内部データを抽出し、単一のviewから個々のページを展開できる。
    this.roomId = this.$route.query.room_id;
    //設定された時間を取得
    await firebase.firestore().collection("rooms").doc(this.roomId).get()
      .then((doc) => {
        const data = doc.data();
        this.roomTime = data.time;
        
      })
      .catch(() => {
        
      });

    
    //60000ms(60s)毎に設定時刻から"--",1減算していく処理。カウントダウンタイマーの実装
    // if(this.roomTime){....ブロックスコープ内での関数宣言(if文)はEslintルール違反

    const timerId = setInterval(() => {
      counting(this);
    }, 60000);
    //thisのオブジェクト管理
    function counting(vm) {
      vm.roomTime--;
      
      if (vm.roomTime === 0) {
        clearInterval(timerId);
      }
    }

    //**thisとインスタンスについて**
  
    //アロー関数で、スコープをバインドしてthisの値を明示的に指定する必要をなくせてる？本来bind不可欠
    //thisは呼び出し元のobj参照、なのでコールバックで渡す時意図しない動作しうる→参照先を確定させたい。
    //仮に、roomClose(this).bind(objA)という表記なら、thisはdataを持ったvue"インスタンス"(→クラスから
    //生成された"オブジェクト!!!")では無く"objA"を参照してしまい、dataの値が使えなくなる。
    // ?による条件分岐。?の左が真なら左辺、偽なら右辺を返す。
    //よって時刻が設定されてない部屋の期限を解消できる

    const result = this.roomTime ? this.roomTime : 999;

    setTimeout(() => {
      roomClose(this);
    }, result * 60 * 1000);
    //Gl objをとるsetTimeout内でのthisは、dataを含んだvueインスタンスを指せないので、慣例的に使用される"vm"(ViewModel)
    //という命名で作成した変数vmに、vueobj(インスタント)を指したthisを引数として渡してあげることで、これまでと同様な挙動を取れる。

    //既定時間に達した際の退出処理

    function roomClose(vm) {
      
      alert("設定された時間に達しました。部屋を退出します");
      vm.$router.push("/");
    }

    this.auth = JSON.parse(sessionStorage.getItem('user'));
    

    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);




//ここから必要、↑はほぼいらないみた











//orderBy説１。
//重複問題、これはカラー変わると一緒くたで変更対象として下にチャット積み上げられてしまう、
//なのでカラーだけ分離やろうな、でもカラーへの検知＋適用のfor文は必要？（初期時）
//なら検知分けてもどっちみちforでいっしょくた？なら後から色変更だけfor文じゃなくて
//computedに行わせるのはどうやろか、ボタンcomputed機構思い出して、色の変更検知→computed
//→色のプロパティだけその場でかえつつ＋f5用にデータも変更してあげる
//これで両方解決？多重dom＋cssプロパティ即時反映問題を一緒に片付け目論見。どうやろ￥、

//そもそも。change→messageデータ変更→domのfor文走る→異なる色情報がiconのcolor,cssプロパティ的に渡される
//それが即時反映の対象でない説が十分ある？以前はボタン→computedでなんとか後から反映できた
//しかし今回は、for→CSSに値直接データ格納、なのか。そうかcomputedの定義難も使えてないみたい。・？
//そりゃ道理でむりなんか？？リロード前提うなずける？f5で正常化みたい・・？
//

//3 自分のハート、ボタンごとまとめて無効してしまってるから、f5でもボタンカラー反映されません、そりゃそう。
//これはやり化変えなあかんね純粋に。

//先読みとりしてます、丸投げ→後から順理解で理解必要な幅広げくとか、全体像見据えないで導入、などのai導入アプローチ
//でこれまでひたすらこけてきたので。。。やり方を変えてみるためにも

//編集タイプの変更検知時点で→編集されたメッセージindexをjsの特殊メソッドで特定しインデクス取得→
//→その変更されたメッセージ"だけ"を特殊方法で置き換え？いや単にset使ってるけどただ配列操作の一つみたいやぞ
//ならここで問題でてくる、本質かわらんのでは・・？だってこれfor文使ってるから、自分の懸念点であった
//for文後反映による即更新説脱却してないもん。。うーん怪しいか。多重処理を阻止しただけかも？
//まあdocchanges系の変更機構としてはいいかもしれんけど。。pushの致命的なとこであった、後から編集への
//対応力、んで編集とわけても、インデックスやり取り問題解消にはなったのか・？ただ for文x modifeid実装
//した試しがなかったから、未だそれが即時反映の道筋なのかわかってないだけか。そう追加形式、何気単調なもの
//しかやったことなかったんか・・ｗならいい経験やったとは思うわ‥・・？、。。ほなやろか

//this.$set(this.messages, newMessage.id, newMessage);

//ん。この時点でthis.messagesから？いや、dom時に初期値格納推定ならあるのか。
//なら格納済みの参照、とすると特殊記法いらんおもうけど・・？
//なるほど、set時にindexが必要で、その"index値"の取得をnewMessageから行うのが容易でないからこその、
//この記法みたい～？ふむ。。。

    

    // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
    roomRef.collection('messages').orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {

          const newMessage = {
        id: change.doc.id,
        ...change.doc.data()
      };

      if (change.type === 'added') {
        this.messages.push(newMessage);
        console.log("メッセージが追加されました")

        //他者の読み取りできんくなってる、indexけいエラーか？重複？読みとり部分やもんな

        //恐らくnewMessage.idがあかんのかなと。いやつあい、
        //newMessage.remakeOptionか？

        //あーわかった。。これ"update"やんけ1の処理。。ｗなさけない・・？うーんでも案外気づけないもの。。
        //firebaseで挙動みて、一気に更新される様みて気づきました。。いやほんとね。うーんなんともいえんなこういうミスは・？

      } else if (change.type === 'modified') {
        const index = this.messages.findIndex(message => message.id === newMessage.id);
        if (index !== -1 && newMessage.remakeOption === 1) {
          console.log("リメイク処理初動 ", newMessage.id);
          this.remakeId = newMessage.id
          // リメイク申請の合意を検知したら、 部屋をリメイクする
        }
        else if (index !== -1 && newMessage.remakeOption === 2){
          console.log("リメイク処理called")
        }
          // Vue.set()関数を使用して、メッセージを新しいオブジェクトで置き換えます

          //多分ここ違うかも、newMessageだけでカラー情報は取得できんはず・・？
          //objやったと思う、changedocdataみたいに、かえなあかんかも、確認しよう
          // console.log("色の編集に成功しました",newMessage,index)

         
      

         else if (index !== -1) {
          console.log("リメイク処理以外確認",newMessage.id)
          
 //プロパティをリアクティブに更新するメソッド、"this.$set", 凄い重宝します。
          this.$set(this.messages, index, newMessage);
        }
        
        
        // 部屋のリメイク申請を検知したら、その申請元メッセージIDを取得する
        //これが呼ばれてないか、受け渡しミス
        //elseifが走ってない、こっからやなならきっと。
        //上がはしってもうてるのか？？あー多分そうやなこれ。elseif不成立やわ。いいねがあるから？
        //個別アプローチしてもうてるんやわ。。どうしよか。。
        //相性かえって悪そう？？

        //elseif、1検知なら→いいねのいイデックスプロパティセットはその瞬間確かに不要？なら優先して
        //リメイク処理走らせていいのか・・・？いやでもそのremakeリクエスト残ってる状態でのいいねに支障が
        //出る恐れある、どっちかした取れないので、、どうしよか。。
        
        //いやまて？一個一個調査してて、index== -1と被るのか？いやかぶるわｗｗ
        //かわったものだけを↑で検知しとるからな。。ならどうする、、変わったもの＋それがremake系、
        //を一番上の"if文”に設定することで、最優先で取り出されるからいけるのかも・・？？
        // -1 && ===1 にて。それはremake系だけ見事抽出に繋がる、すなわち以降のelse if文に支障が生じないので、
        //heart処理も問題なく行える。なら次。その流れで変更＋その対象がremake=2をとった、なら優先で
        //リメイク処理、おおこれも問題なさそうやぞ・・・？？ならいけるかも、順序入れ替えにて。。！
        //やってみよか！


      }

      //カラーだけ自分で取り扱う？いや相手からも寄せられる、既存のメッセージに対する色変更の、"即時適応”
      //が今の課題なのか。自分相手問わず。対象のメッセージのdomの再更新が鍵なのか？自分追加ばかりで再更新が
      //できてない？いやちゃうか？colorプロパティやから・？

      //なんかなおりましたｗなんやったんや。多分受信者のチャット、自動でバーが移動しないからかな。うーん表示されないと
      //きづかないから、”新規メッセージ下にあります",機能ないなら一番↓にもっていくありなんかも・・？でも特殊系か、、
      //新規メッセージ確認＋それが描画できてないなら通知表示、、うーん少し手間そうやからやめとこか。。ｗ
      //まあとりあえず据え置きかなそうなると。。んでんでそれより
      //色グレーのとき、データ変更はされてるけど肝心の描画ができてない
      //(というよりsetでfor介してるのに色即時適応されたのが奇跡に近いのか。。解明しなやっていけんかも・・？？)
      //確認やね、dom周りなはず、、あーインデックスなんかずれてたっけ？2回目


          // 後にforに展開するために、messages配列に格納(配列代入につきpush)
          
    
        });
      });

    if (localStorage.message) {
      this.joinmessage = localStorage.message;
      localStorage.message = '';
    }  
  },

  computed: {
    
    ...mapState(['remakeId']),
  
    invalid() {
      if (!this.body) {
        return true;
      }
      return false;
    },
    //即時反映設計じゃない説１、適応されてないので、代わりに追加ドムで変更版描画につき、その予測。
    heartColor() {
      //定義名はheartColorだが、ここではheartStatus内部データ（依存関係となるデータ？）が変更
      //されることが、このcomputedプロパティ発火の条件と推察。もちろん同名定義も検討できるが、その場合
      //duplicatedエラーとなったので取りやめ。

      //data.heartStatusが変れなそうなので（個別認知）、それを依存関係に組み込めばなんとかか。
      //data変更とか読み出しのとき→どっかcomputedに記述できるものにも格納して、それリターンかな・？
      //無限なってまう？ぐう。。検証一つ大変やな、。
      return this.heartStatus ? 'red' : 'grey';
    },
  },
  methods: {
    isMyMessage(data) {
      if(this.auth.uid == data.userId)
      {
        return true;
      }
    },


    threeTimer(){
      //60分のタイマー開始
      

      // timer参照元=30にする


const intervalId = setInterval(() => {
  //1分毎(60000)に値を１差し引く、タイマーの基準の値
  this.remainingMinutes -= 1;

  //-30分？タイマー系は初期値を100にする必要がある。
  //違うかった。勘違いだけやった。100分率は同じ、あとはそれをremain使って
  //適切に減算処理するために、変数を混ぜてただけでした、かつ基準にする
  //ならりメインを初期値６０にしたいなら,/60してあげればいいだけなんか、なるほどな
  //やっとよめてきた
   this.timerValue = (this.remainingMinutes / 60) * 100 

//30分経過すれば経過報告モーダルの表示
  if (this.remainingMinutes == 30) {
    // clearInterval(intervalId);
    //初回でないので挨拶の必須項目を解除
    this.join = false

    //内容を適切なものに変更しダイアログを表示
    this.statusMessages = "30分が経過しました、進捗を入力しましょう"
    this.status = "進捗"
    this.checkInDialog = true;
    this.this.stepIndex = 1
  }
   //2回目のダイアログ処理
   if (this.remainingMinutes == 0) {
    clearInterval(intervalId);

    // 初回でないので挨拶の必須項目を解除
    this.join = false

    // 内容を適切なものに変更しダイアログを表示
    this.statusMessages = "1時間が経過しました"
    this.status = "活動終了"
    this.checkInDialog = true;
    this.stepIndex = 2
  }




}, 60000); 

  //2回目のダイアログ処理、更に30分後（時間変更機能はもうこの際廃止する、再申請以来を
  //凝らずにそのまま流す感じ？の30分申請でね。

  //何を基に30分再開するか。マッチングシステムは活かせそうやけども。。
  //送信→30分カウント開始？、いやこれローカルタイマー、2回目はいかんわ。
  //うーん、内部タイマー、一つ1時間で裏で回しとして、1回目のとき表記-30分でいいかな？
  //ローカル固定で問題ないもんな。んで表記かタイマーが0,or30で一回目、二回目も。
  //1回目記録なしのタイムアウト処理もまああるが吉やが。。退出権限としてやはり盛り込むべき？
  //ちょい面倒さはあるけどねマッチ経験より、わりと複雑化、タイマー系。うーん一旦なしでいいですかな。。
  //1時間経過モーダル作成（ここ複製やめとくか・・？あんまりいい想いではないが。。送信メソッドがだって
  //違うもんな、だから変数で@clickの発火メソッド変えるわけやけど、わりと面倒かえって複雑間、ならさっきの
  //経験踏まえてdom作り直すかここ、やしお疲れ様でしたモーダルは内容割と変わるので別で作成と、
  //いやただ内容入力はあるんかｗ、うーん。そのままもありか・？悩むなぁ。。割合の問題？
  //あーあとレート簡単そうやし盛り込む予定、少しの面白さでね

  //んでそこ表示が、"退出"か"続ける",の2個用意。退出クリックなら部屋削除してしもていい？？
  //継続ならチャット解禁とか（いうても通常時か）にして、"再開メニュー"を表示。
  //他めんどそうなのは、途中離脱への対処かな、正式な退出処理、なにをトリガーに可能とするか。。。
  
  //うーん。そんな感じかな、では実装にうつっていいかな。  
  //30分経過（2回目の本入力)から5分相手の入力が無かったら、相手離脱告知と正式な途中退出ボタンは
  //用意したほうがいいな。うん危ないのここぐらいやし？うむ。。んで相手に警告・・？途中離脱ボタン
  //相手が迫られたら→相手のユーザー情報に-1加える、とかはできるかぁ。んで1時間達成で両方＋１かな。
  //-1処理、相手ログイン時にしたほうが確実ではあるか？クリアを0のまま保持してたら-1とか？0のまま
  //いけないページログイン確認→-1処理とかは組み合わせでできるかぁ。
  //まぁまぁ？


},
   
    toggleHeart(data) {

     
      //  これ３項演算子として正しいが、まさかの計算結果をどこにも代入できてないのでアウトです・・。ｗ
      // this.heartStatus === 'red' ? 'grey' : 'red'; 
     // ハートの点灯状態を切り替え、まさかの初見の＝２つ続き。。。いるんや２つ。。。以外、rubyと違ったり・？
      this.heartStatus = this.heartStatus === 'red' ? 'grey' : 'red'; 


  
    
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
     
       //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').doc(data.id).update(
        //なぜかtrue適応されてない？？
    { 
      heartStatus: this.heartStatus
    }
      )
      .then(() => {
         
      })

    },
   
    

    textFormActivate() {
      //30分（変数）がある間？？いや可変対応できるように、特定の値orモーダルスイッチか？
      //記録の保存→30分間。。何を契機に開放するか、条件が複雑かも、単純な時間ではないので。
      //かといって解放と開始は2人でそろえるべき。チャットはしゃーないか、というより契機の持続（1時間スイッチがデフォ）
      //ボタンでtextFormActivate()を最後らへんにコールバックで呼んで発動でよさそう、モーダルごとのスイッチは別に
      //メソッド指定がデフォルトなので。うんそやな
      this.isDisabled = false;
    },
    exit(){
      //相手に退出を告知、(部屋を削除？)、ルータプッシュでリンクの移動
      this.checkOutDialog= false

      this.$router.push('/');

    },
   stay(){
    //タイマーの再開、つまり処理をはじめから完全にやり直し？
    //いやこれまだか、stayでいいかも、作業再開ではないからね
    this.checkOutDialog= false
    this.textFormActivate();
    //friendActivate,ほか移動アクティベイトなど、一括関数で行った方がいいかも？関数増えすぎ抑止につき？

    //作業再申請ボタンの表示

    this.restartBtn = true
   } ,
   async remakeApply(){
    //モーダル表示？？いやいいか、なんかアラートとか下に表示させて、相手に通知だけでいいかな
    //firebaseにおける、ルーム内の何かのステータスを待機中にする、roomindex的なやつ、
    //んでその値をお互い検知して、相手主体で変わったら？うーん片方domまあちょっと面倒なんのよな、どっちが
    //やったか把握コスト、ならどっかに待機バー？とサブ画面出していいかも二人の。んでローカル変数で申請者と承諾待ち
    //わけてしまうような。（時短、楽設計）
    //値てきには、特定のもの0→１（許諾まち）→２（双方合意）→0にしながら部屋のギミック再開手続き
    //2段階docchanges?いや、その特定の値が1変化で相手検知、2変化で両方検知設計、でいいはず、modi=1,2かと
    //まあここいいねと被るのがだるいくらいか？んで２なったらまあ移行確認ダイアログお好みで、部屋の内部データリセットorダイアログ
    //を表面上再生成でしまい、indexかえたらはやいかな～チャットオフとかフレンドオフはまあ一緒くたにするつもりなので。
    //ふむふむ、、

    //まず値を１にかえます。先行者用の処理になります。後発者は1→２処理。
    //これルーム固有の値必要なんか。ルームステータスそのまま使っていいかな？サブコレの方、まあそのまま使えそうやし。。？
    //ええですかなー、サブスク対象乖離ならやめるべきかも

    //ううう。。対象違うからちょっとめんどくさそう、、んで一緒にすると空メッセージ扱いでindexずれそう。。
    //あーそうすると。。初めの案、メッセージ形式で申請系送信がありになるんかも。。
    //特殊ステータス？？、特殊メッセージかな。それがあると表記が特殊になって、許諾と却下のボタンがハートの横にもついてくる。
    //応答とかもそのままやりやすそうやから合理的かも・・？？
    //検知が楽なのがでかいんよなこうすると。状態変化もろに受け取れる、しかも同階層でね
    //んでこれすると単に設計楽なだけでなく、保守性、簡便性、軽量性まで保たれると思うんだ。。んで多分こういうのが
    //賢い？正しい？プログラミングだとも思ってるので。。設計の指針、指標として。。ならいいとおもう・・！

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
      )//vuex無理目みたいでしただる・・終わらせたかった今日中に・・
      .then(docRef => {
        this.scrollToBottom();
        console.log("remakeApply Called",docRef.id)
        this.remakeId = docRef.id
        // this.$store.commit('setRemakeId', docRef.id);
})

//はあくそだるくてわろた
//まあidは取れてる、それ有効的なうけわたし
//あかん疲れすぎて脳回ってないわもうやめとこ

const remakeIdRef = firebase.firestore().collection('remakeIds').doc('current');
remakeIdRef.update({ id: this.remakeId })
.then(() => {
  remakeIdRef.onSnapshot((doc) => {
    if (doc.exists) {
      console.log(doc.data().id)
    }
  });
})
.catch((error) => {
  console.error("Error writing document: ", error);
});


//なんかバグた、、、ボタンでてこんくなった。。
//こっちのほうがはやいかなおもたねんけど、、相手側remakeId取得できない→取得にdocchagensかvuex必要
//ならこの機構たしてアプデ→編集連続でやったら正解おもたねんけど。。

//ああわかった。option最初０渡してボタン無効化、んで2回編集でぐっちゃぐっちゃなんやろうな、きえ、
//vuexいくわなら。

// await roomRef.collection('messages').doc(this.remakeId).update(
//   { 
//     remakeOption: 1
//   }
// )
// .then(() => {
//   console.log("remakeOption updated to 1")
// })

        
      
        
      

    
    //んで合意もったら再開手続きする感じで。まあただここで一応firebase必要ね、1:1のやり取りにはなるからね。

   },
   remakeAgree(){

    //更新するためにドキュメントid、つまりメッセージ元のid取得しなあかん、変更先のメッセージid
    //これは変更検知で行けると思う、modiの次点でremakeidをどっかに格納する？this.remakeId = doc.id
    //それができれば正しくupdate実行できるので、どっか割り当ててなかったっけ


    //こっからエラーになります、no pass
    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
       //送信者の情報、メッセージ内容をアップロードする
      roomRef.collection('messages').doc(this.remakeId).update(
        { 
        remakeOption:2
        }
      )
      .then(() => {

        
        this.scrollToBottom();
        console.log("remakeAgree Called")

        //相手にもこのことチャット以外に内部的につたえる、、１の申請はチャットだけで基本良いが、
        //remake発動はそうもいかん、んで早いのはdocchangesで2検知なら→ローカル整理よね、そうするか。ー
        
      })


   },
   remakeCancel(){
    //何を変える？メッセージ本文をキャンセルされました、にすればいいんかなー？？んでボタン無効化？？
    //まあとりあえず本文か？脱退とは別にキャンセルほしい？いや最悪放置でもええんか。。同意だけみせて。一旦ならそれでいくかぁ、最小設計構想でね。

   },
    clear() {
      
      this.body = "";
    },
    scrollToBottom() {
      const chatWindow = document.querySelector('.chat-window');
   chatWindow.scrollTop = chatWindow.scrollHeight;
  // this.$nextTick(() => {
        // this.$refs.chatWindow.scrollTop = this.$refs.chatWindow.scrollHeight;
      // });

},
async contentsRecord(){

  console.log("contentsRecord called")

  

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

      //this.contentsが空でした2回目

  const  userRef =await firebase.firestore().collection('userlist').doc(this.mydocid)
            userRef.collection('records').add(
              { 
                 createdAt: firebase.firestore.Timestamp.now(),        
                time: "00:30",
                contents:this.contents,
                date: this.date,
                
              }
            )
            .then(() => {
              console.log("記録成功")
              
              
            })},





    submit() {

      //やらかし？後半サブミットでへんなやつ記録されてまうわｗｗ
      //素直にサブミット分岐か？いやメッセージ系とダイアログ機構をかえればいいんやわｗ
      //これはまとめすぎやな。まあでも無理じゃないんか・・・どうしよか。。

      // if(this.join === false)
      // {
      // this.contentsRecord();
      // }


      //初回以外であれば、記録の保存
      !this.join ? this.contentsRecord() : null;

      //最終の保存であれば、次にお疲れ様モーダルの表示と特定の処理を実行(関数内で条件分岐、楽でいいかも！ｗ)
      //(関数内は散らかるけど、他は関数化できてdomとかきれいに収まる！！ありかも、関数化の真髄はここなのか・・！？！？)

      if(this.stepIndex === 2 )
      {
        //お疲れ様モーダルの表示と特定の処理
        this.checkOutDialog = true
        this.stepIndex = 0
        
        
      }


      //30分後の送信であるなら→タイマー再展開（時刻の入力、関数実行）
      //1時間後の最後の送信なら→お疲れ様ダイアログ、各種機能解禁、オプション出現
      //何を参照するか。普通にcycleid ++でifで純粋に？？？
      //奇数→タイマー復帰＋再開、偶数2以上→終了案内？いやそれだと2セット標準に？？
      //ぐうけっこうここ大事なんか。ｗとりあえず形だけつくって、後から変数導入とか
      //最適化することもできるが、、どないしよか。
      //ここ保留でいいかななら、全体像わりと必要みたいやわ。2回目のモーダル復帰の動作確認は
      //できたのでよし・！一応タイマーもテスト環境の1分で検証にて～。！

      //他緊急の退出ボタン（告知なしに脱退されるよりはまし？確認厳重にして、レート下がること告知
      //ほかは2回目記述→recordに同時に勉強記録保存やな、これわすれてたｗ時間もあわせて保存やね、
      //そやそや、この連動大事よね

      this.checkInDialog =false

      //不具合中ですかい？
      
      let messagedata = this.body;

      //そうか、中盤greetingなしにしてるからここ稼働せんくなるんやなるほどな、かえよなら
      //contents毎回削除なら、メソッド一緒でもまだギリギリ棲み分けできるか・・？？
      //なんとかいけるかも・・・？？
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
    //forで指定したindexを引数として渡し、押下されたbtnを識別する、
    async FriendApply(index){
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
      let dataArr = [];
      //firebaseでは配列の取得が基本のため、目的のデータを含んだ配列objとしてまず取得。
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

