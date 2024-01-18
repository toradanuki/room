<template>

  <v-app id="inspire">
    <SidebarSum />
    

    <!-- 入室時のダイアログ -->
    <v-dialog v-model="checkInDialog" persistent  max-width="600px">
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
        <!-- ここ値がディレクティブになってない読み？？いやでもほかできとるんか。。条件かえまくりよ、。根幹から。。 -->
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
        <v-btn color="red darken-1" text @click="breakUpDialog=true" large depressed>退出</v-btn>
         <v-btn color="green darken-1" text @click="stay" large depressed>続ける</v-btn> 
      </v-card-actions>
    </v-card>
  </v-dialog>

 <!-- 解散確認ダイアログ -->


  <v-dialog v-model="breakUpDialog" persistent max-width="600px" transition="dialog-bottom-transition">
    <v-card  class="pa-4" color="pink lighten-5">
      <v-card-title class="headline text-uppercase" style="color: #FF5252; font-size: 24px;">
      {{ breakUpDialogTitle }}
      </v-card-title>
      <v-card-text style="color: #FF5252; font-size: 18px;">
      {{ breakUpDialogBody }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- "isListener ? exit : breakUp" -->
        <!-- 評価式のときは？もしくは左変数のときは？、メソッドの場合なぜか()も必要らしいです・・ -->
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
          <!-- ここが今のトラブル、ボタンテキスト後から普通渡せないのでは？ほかはjoin表記おかしい？普通にjoinでいいのでは？Toka -->
          <!-- @click="buttonText ='参加を表明する' ? join() : oncancel()" -->
          <!-- <v-btn :disabled="isvalid" :color="buttonColor" text @click="join">{{ buttonText }}</v-btn> -->
          <!-- <v-progress-circular v-if="buttonText === '待機中'" indeterminate color="primary"></v-progress-circular> -->
        <v-progress-linear :value="progress" color="primary"  />
        </v-card-actions>
      </v-card>
    </v-dialog>



  <!-- 退出ボタン,stepIndex=2で表示でよさそう！退出うけつけ、正式退出処理実装
  ならここに顔アイコン途中から表示どう？？プロフ参照用？わかりにくいかな？レート表示はどう？
画像はあるけどもーー、、まあここ相手顔アイコンで、申請＋参照にしたらわかりやすいかも。・・！ -->
    <v-main>
      <h3></h3>
      <!-- この下二個同時けしてなぜか崩壊らしいです -->
      <!--けしたら治る、つまりどっちも有効になるとdomが崩壊するらしい
      ええこれ単純なroom.thumbnailURLエラーでは？imgないからアウトなだけでは？きしょすぎそれんら -->

      <!-- はいけつろん（3時間かけたかな）、room配列削除→参照できずimgエラー→index3のときにのみ参照
      →その時モーダルで気づかなかったが致命的なエラーで実は描画システム崩壊、停止→その因果関係が見つけ出せず、
    意地になって手当たり次第に探る→エラーは気づいていたものの軽視、風が吹けば桶屋が儲かるのようにそんな遠いもの
  まさか無関係だろうと放置→実はそこが落とし穴、んでから配列用意したら普通にボタンとおった、正常に戻った
いやまじでここまでどんだけ。。。考え方覆された・・・？いやそやな、、この因果関係どうやって掴むんや、、、基礎ぽろぽろも
そうやが、これも小さな積み重ねなんやろな、、でもってこの致命的なミス、反省点を活かせるならどうすべきかって話なんよな
これ遭遇するとわりともう維持もつらくなるんよな、、いやこういったこともう一度遭遇しそうで、それあっさり解決できるものとも
思えない程なんよ。。くっそどうしよか。。。つれ、、
一気開発と、実装途中やめと、エラーガン無視と、システム的欠陥安易疑いと、基礎知識やはり痛いことはあるのと、。。
いやでもこれ大分むずないか。。。まあでも、結局はstepindex導入が契機やっけか、いやそれもそやけど、それ以前にもなんか
ボタンきかなくなる印象があったりなかったりなんか。。んでそれら動作確認半端なまま持ち越したせいで、遅れて欠陥が露呈したこと
ほかコードリファクタリング間隔おそくて、整備意欲とか管理リスク上がっていたこと、未解決持ち越しと、一気の実装を同時に
引き起こして、のちに直面したときｎ因果関係当然探れないような状況に陥っていたこと、、調子のって直前に広く手を付けて、
気持ちよくなってほか甘い中index実装したこと。。減点対象とされる身近な行為があまりにも短期に重ねすぎた必然の結果かなと。。
まじやらかしいやな、、くっそ。。。テストコードないのもそやけど、そんな単純じゃなことでなかったと重々な、、すいませんでしたひあ。。 -->
      <v-card v-if="oneHourReported" max-width="300" outlined shaped>
       
       <!-- 相手の画像挿入は一応検討！ -->
       <!-- tabunkorennoka? -->
     
        <v-btn @click="confirmBreakUp">解散する</v-btn>
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
                              <!-- 総合判定がいいかもな。。 -->
                              <v-btn v-if="!isMyMessage(data) " :disabled="!oneHourReported"  depressed  rounded text @click="handleClick(data, index)">
                                {{ isFriend(data) ? '個人チャットに移動する' : 'フレンドを申請する' }}
                              </v-btn>
                              <v-divider class="my-3"></v-divider>
                              <v-btn depressed @click="toProfile(data,index)" :disabled="!oneHourReported && !isMyMessage(data)"  rounded text>プロフィールを参照する</v-btn>
                              <v-divider class="my-3"></v-divider>
                              <v-btn depressed rounded text>閉じる</v-btn>
                              <v-divider class="my-3"></v-divider>
                              <v-btn   depressed  rounded text @click="isFriend(data)">
                                test
                              </v-btn>

                            </div>
                          </v-list-item-content>
                        </v-card>
                      </v-menu>
                    <!-- </v-menus> -->
                    <!-- メッセージ部分の記述 -->
                    
                    <v-list-item-content>
                      <v-row>
        <v-col cols="11">
          <div class="text-caption">{{ data.createdAt }}</div>
          
          <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
          
        </v-col>
        <v-col cols="1">
           <!-- 自分のもの && 色が無効でボタンを描画しない
            :class="{class名:true}"で、クラス割り当ての条件分岐が可能
           "ハートが赤 && 自分のもの"ならホバークラスを解除して、常に描画をする -->

           <v-btn v-if= "data.remakeOption && !isMyMessage(data)" @click="remakeAgree"  >リメイクする </v-btn>
           <!-- <v-btn v-if= "data.remakeOption && !isMyMessage(data)" @click="remakeCancel"  >辞退 </v-btn> -->


          <v-btn icon v-if="!(isMyMessage(data) && (data.heartStatus === 'grey' || data.heartStatus === false) )"  
          :class="{ 'heart-button': !(data.heartStatus === 'red' && isMyMessage(data)) }">
          

            <!--  自分のボタンであれば、クリックメソッドを無効にする -->
           <v-icon :color="data.heartStatus === 'red' ? 'red' : 'grey'" @click="isMyMessage(data) ? null : toggleHeart(data)"> mdi-heart</v-icon> 
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
      <v-textarea v-model="body" :disabled="!oneHourReported" append-icon="mdi-comment" class="mx-2" :label="handleTextFormLabel()" rows="3" auto-grow>
      </v-textarea>
      <v-btn icon :disabled =false>
            </v-btn>
      <v-btn class="mr-4" type="submit"  @click="submit">
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
// import { mapState } from 'vuex';

export default {
  data: () => ({
    dialog: false,
    test:"",
    checkInDialog: false,
    statusMessages:"マッチングが成立しました。作業内容を入力して、最初の挨拶をしましょう！",
    messages: [],
    timerValue:100,
    intervalId:null,
    // 0にしてしまうとダイアログ閉じなくなってしまうのかも、初期値参照で。タイマー０でとめれてないから？
    remainingMinutes:5000,
    dialogVisible: false,
    chip4: true,
    isListener:false,
    whatup:"aaa",
    halfHourReported:"",
    oneHourReported:"",
    remainingSeconds:5000,
    join: true,
    btn: false,
    room:[],
    logstack: "",
    checkOutDialog:"",
    breakUpDialog:"",
    myUserListId:"",
    restartBtn:false,
    mydocid:"",
    wasInactive: false,
    date:"",
    remakeId:"",
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
    drawer: null,
    joinmessage: "",
    breakUpDialogTitle:"解散手続き",
    breakUpDialogBody:"記録は削除されます、本当に解散しますか？",
    sender:"",
    isDisabled:true,
    links: [],
    user: {},
  }),
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

    // デプロイ環境ではローカルストレージ変更も視野,stepIndexも後ほど
    this.listenBreakUp();
    this.remakeListen();
    // this.setReportedStatus();
    this.setTimer();
    this.observeMessagesAndGet();
  },

  // computed: {
  //   // vuexの呼び出し記述を少なくする設定
  //   ...mapState(['remakeId']),
  // },

  methods: {

    confirmBreakUp(){
      this.sender = true
      this.breakUpDialog = true
    },


    // 既にフレンドであれば、メニュー項目を個人ページに変更
    // ここ確か改修中、４つ条件分岐、フレンドx自分is
    // フレンドであれば→相手参照時ボタンの表記と内部処理をかえる（うんそやな、自分isは無関係なんやったわごめんｗｗ)
    // つまりフレンドであればtrue返すし、それ基に表記と関数処理かえればええんか、うんいこいこ
     async isFriend(opponentData){
       let result = false;
       await firebase.firestore().collection("userlist").where("displayname", "==", this.auth.displayname).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
      
        this.myUserListId = doc.id
        const friendListSnapshot =  firebase.firestore().collection('userlist').doc(this.myUserListId).collection('friends').where('name', '==', opponentData.name).get();
        
        //やらかし。getと同じコンテキストでreturnしてもうてたわ。。んでawaitもないからアウトやったんかも？？
        //いやでもまてよ？？コンソールでは正常に動作してたからおかしくない逸れ？先評価の納得いかない、それをもって自分も
        //許容してたから、、なにそれ
        //まあ飛ばすか。。。returuが実行順だりいぃってこと念頭において締め？
        
        console.log(!friendListSnapshot.empty,"friendtest")
        // クエリの結果が空でなければ、対象の相手がフレンドであればtrueを返す
        result = !friendListSnapshot.empty;
        //  return !friendListSnapshot.empty;

        // result = !friendListSnapshot.empty;
        });
      });
      console.log(this.test,"testtt")
      //えーはい外にreturn出したら途端に動作しました。
      //でも納得いかない、中にreturn記述したとき、上のコンソールでは出力正常やったのに、なぜか上をスルーしてget見取得のあっま
      //単独で実行されてた。。。イヤー不可解やったなこればかりは、、これ続くとまあきついねんけど、returnがちょい一筋縄ではいかないこと
      //思い知らされた一見でしたわ。。
      //まああと割とこれは納得やけど、asyncawaitないと先にreturnやから注意ね。はい
      //returnの取り扱いまじでこれから気を付けよか。。consoleでの目視ごり押し戦術通用しなそうやったからな。。返り値みるまで
      //たどり着けないドツボやからねこれ、、こわいわ・・上からの順信頼置けんくなるreturnね。。
      return result
    },

    // 自分のメッセージであれば、ハートボタン無効+常にハート表示
    isMyMessage(data) {
      if(this.auth.uid == data.userId)
      {
        return true;
      }
    },
    async handleClick(data, index) {
      //なるほど、、、全スルーでなんかreturnだけはしってみるみたいやぞ、、コンソールより
      //前に走ってる可能性ある・・？わからんけど。。
    const isFriend = await this.isFriend(data);
    console.log(isFriend,"なんかisFriendのtrueが移ってないみたいやぞ・なんでよぉ。")
    if (isFriend) {
      this.toFriendRoom(data.name);
    } else {
      this.FriendApply(index);
    }
  },
    startTimer() {

      // 60分間のルーム進行を管理

      //2個目タブでなぜかタイマー閉じられてない、なんでや。
      console.log(this.intervalId,"インターバルid確認")

      //時間巻き戻しの時無理なこと、予測不可あるからこれ検証に組み込むのやめよか
      //コードは理解してるつもりやけど、深い事情まではわからない、踏み込まない方針で一旦いこうや、円滑化精神でね
       // 既存のタイマーがあればリセット
       if (this.intervalId) {
        clearInterval(this.intervalId);
        console.log(this.intervalId,"インターバル削除")

      }
      //時として？（理由は未だ不明） 新規インターバルが開始してしまってる案件
      //1時間経過してるのに新規カウント開始はあかんはず、どうやって抑止しようか,ifでなんかいけへんか。
      //更新自に始めてしまうわけやから。onereportあればタイマー未実行でええんかも、後から切り替える感じで
      //ただいまなんか所有してしまってるのが謎案件、送信してないはずなのに
      //どっかで作動かセッション引きつぎのどちらか、要確認

      //これでonerepotedあれば→タイマー静止、がリロード時でも成立するかも。！！多重起動の阻止ね。
      //でもないなら・・？→進行中認定で、起動が正解、になるんやとおもう。！
      //よしまあ一回組み込んでみるか・；

      //作業終了してるならタイマーは稼働させない

      //f5更新時、タイマー多重起動はさすがに防ぐべき思うわ。くみこもか、事前の削除は機能しないみたいなので
      //ここもかいしゅう、まあ本来は違うのか？？取得参照じゃなくていいはず・・？？
      //ん－。内部でやりとり。。再起動時初期値０で、毎回起動してしまう。ならやはりセッション参照に基づいて、
      //タイマー稼働かきめなかんな、よしそうするとかえるひつようとね

      //しっかり取得、次セットいつしてるか見直し

      this.oneHourReported = sessionStorage.getItem('oneHourReported');
      this.halfHourReported = sessionStorage.getItem('halfHourReported');

      console.log(this.oneHourReported)

      //あれぇ。。。f5おしたらなくなってるんやがぁ。。ｗ
      //やはりローカルでした？
      //あと2窓でタイマーずれやっぱり確認、この仕様は追わなあかんぽ・・

      //いやまじでコストえぐかったわｗｗやっとできたわ、大変やったなほんまｗｗ

      if(!this.oneHourReported){

      this.intervalId = setInterval(() => {
        this.remainingSeconds -= 1;
        this.timerValue = (this.remainingSeconds / 3600) * 100;

//this.oneHourReportedが保持されてしまっとるぞいZ！！
// あとは2タブでの多重エラーが肝みたいやわ、がんばろここ大一番
        console.log("3",this.remainingSeconds,this.oneHourReported,this.stepIndex,this.intervalId,"halfですよん",this.halfHourReported)

      
        //これ途中復帰はしるときとはしらんとき？戻る処理にて、2人目ははしった
        if (0 <= this.remainingSeconds && this.remainingSeconds <= 1800 && !this.halfHourReported) {
          // 挨拶の必須項目を解除
          this.join = false;
          // ダイアログの状態管理// 

          //多分一回目のあとはstepIndex不要の直通でいいかも
          //なぜならお疲れ様モーダルとの接続がない、そこで完結だからさ。
          //うーんなら廃止いいと思うやってみよか。
          

         sessionStorage.setItem('halfHourReported', 'true');
         //一応データの方もいじっとくだけです。
         this.halfHourReported = true;
          this.statusMessages = "30分が経過しました、進捗を入力しましょう";
          this.status = "進捗";
          // checkinは間違ってない？？
          this.checkInDialog = true;
        }
        //わかったかも。これ無限に0以下派かkでダイアログ繰り返しtrue成っとる説あるわい
        //うむ。どう？いやないか？W

        //clearIntavlで、remaing初期値エラーはある

        // 衝撃の、this.onehour =trueだったらしい、、ふさげんなぁ。。。。なんやそれほんま・・・

        //2回目通らん現象、謎の正規タイマーが残ってしまってるからみたい。
        //これが一瞬ひらくけど？条件が複雑なって消えないのかも、0以下ならなくて？現にこのコンソールで何かよーわからん
        //タイマーが光っとるねん。。。。もうこれやめたいれす。。。

        //応え分かった、これvueの不具合かえぐい仕様やわ。まじでわかんやろこれ。2回操作できないなんて知るか
        if (this.remainingSeconds <= 0 ){
          // && !this.oneHourReported 

          clearInterval(this.intervalId);
          this.join = false;
          this.stepIndex = 2;
          this.statusMessages = "1時間が経過しました";
          this.status = "活動終了";  
          this.checkInDialog = true;
          // ダイアログか、関数どっちか終わり読みまず
        }
      }, 1000);
    }
    },
    handleVisibilityChange() {
      // ページが非アクティブからアクティブ化した場合のみ、ページをリフレッシュする
      // (もしくは、setTimerだけ改めて実行して、遅延解消処理だけ図るのどうやろ。
     // ただこれでも多分環境によっては完璧ではないと思う、予期せぬアクティブ状態な省電力モードで
     // タイマーずれ解消は知らせれなかったりね。やはり色々組み込みか、サーバーサイド処理が確実やな。、、
     // サーバー運用コストがねあと管理ハードる、、ぐう。。)
      if (document.visibilityState === 'hidden') {
        this.wasInactive = true;
      } else if (document.visibilityState === 'visible' && this.wasInactive) {
        //ページをリフレッシュでなく、関数実行に切り替えてみる
        // location.reload();
        console.log("あああああああcalled setTimers")
        this.setTimer();
        console.log("あああああああcalled setTimers")
        

        this.wasInactive = false;
        console.log(this.remainingSeconds)
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

      //内部タイマー確定処理、f5更新のともわない離脱復帰にも適応したい。。
      //そうしないと、減算処理だけ伴わない離脱時間分、同期ズレが生じて
      //相手との進行がかみ合わなくなる。。。これが今の課題、、んでもってその挙動どういった
      //時に生じるか、実装環境で起こり得るかわからない。。。何かライフサイクル特定さえできれば
      //差分取得処理をそこに差し込んで（中間復帰処理にsetTimer())、時差を現状のシステムのまま
      //抑制できると思うんやがぁ。。うーん聞いてみるか



    // -----現在時刻とルーム経過時間の差分を取得-----
      const docRef = firebase.firestore().collection('rooms').doc(this.roomId);

      //セッションストレージにcheckInKeyを格納
      //セッションストレージに格納されたcheckInKeyを参照し、Keyがあればthis.checkInDialog = true
      const checkInKey = sessionStorage.getItem('checkInKey');
      if (checkInKey) {
       this.checkInDialog = true;
      }

      docRef.get().then((doc) => {
        // サーバー側でのタイムスタンプを取得する
        const now = firebase.firestore.Timestamp.now().toDate();
        const workStartAt = doc.data().workStartAt.toDate();
        const diffSeconds = Math.floor((now - workStartAt) / 1000);
        const workTimeLeft = Math.floor(60 * 60 - diffSeconds); 
        console.log("1",this.remainingSeconds)
        this.remainingSeconds = workTimeLeft
        console.log("1",this.remainingSeconds)
        //一応タイミングは意識でここ組み込みしてみる
        this.startTimer();
      })
console.log("2",this.remainingSeconds)
      // this.startTimer();
    },

    setReportedStatus() {

//多分この文がアウトみたいやわ、タイマー前に基本全部オンなってるみたい、そうつまり適切に
//削除ができてないんやろうな、どこかでセッション削除しっかり行わなあかん・
//リロード？？離脱時？テスト環境やから難しくはあるけども

//にゃるほど、これが不要やったんかぁ、くうううう、確かにな。、。リファクタリング丸投げ
//の月もあるかも。。・？なるほどなかなり悲惨やったんかあの時、、、反省です、、、


      // const halfHourReported = sessionStorage.getItem('halfHourReported');
    //  const oneHourReported = sessionStorage.getItem('oneHourReported');

     //もしセッションストレージにレポートがあれば、それぞれデータに格納する
     //あれこれ文字式なってない？？ミスってる説全然あるでい。。
     //単純化するか、途中エラー恐れてifで通すかは悩むが・・
     //まあtrueeyでやりとり、でええ思うわ、そうしよか

     //ただ未検証って扱いでねこれ、あああえて保留はありやが。。

      // if (halfHourReported) {
      //   this.halfHourReported = halfHourReported ==='true';
      // }
//ん？？ここがエラーの原因ですかい？？でも引数が基からfalseならそんなことないはずでは。・・？
//いやまてよ、、こんな引数設定した覚えないぞ、、、なんやこれ、thisじゃないもん。なによこれ

//個々原因？+セットなんてしてないはずよねｗｗまあこれ初期値０になってる可能性ある、
//この文の理解確かに甘いからね、けそか

      //  if (oneHourReported) {
      //    this.oneHourReported = oneHourReported ==='true';
      //  }
    },

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

    toFriendRoom(data){
      console.log("toFriendROOm called",data.name)
      

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
      // ハートの点灯状態を切り替え
      this.heartStatus = this.heartStatus === 'red' ? 'grey' : 'red'; 

      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);

      //送信者の情報、メッセージ内容をアップロードする
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

// 最後にroomsコレクションのドキュメントを削除する
await roomRef.delete();
      
      //相手に退出を告知、(部屋を削除？)、ルータプッシュでリンクの移動
      this.$router.push('/');
    },

    // 1時間経過後のダイアログ滞在処理
    stay(){
      //タイマーの再開、処理をはじめからやり直し
      this.checkOutDialog= false
      this.breakUpDialog = false
      // this.textFormActivate();

      //friendActivate,ほか移動アクティベイトなど、一括関数で行った方がいいかも？関数増えすぎ抑止につき？

      //作業再申請ボタンの表示

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
      .then(docRef => {
        this.scrollToBottom();
        this.remakeId = docRef.id
      })
    },

    remake(){
      
      //部屋情報初期化
      sessionStorage.removeItem('oneHourReported', 'true');
      sessionStorage.removeItem('halfHourReported', 'true');
      sessionStorage.setItem('checkInKey','true');

      //リフレッシュ処理しちゃう
      this.remakeCountDown();
    },
    remakeListen(){

      // データが2に変更を検知、

      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      const messagesRef = roomRef.collection('messages');

      //階層一個だけずれてる説はあり？modifiedで限定してるから実質不要なのはあるか・？
      //リスナー階層もう一つ限定すれば、通信料とかなんとなく減りそうな気はしたり？？
      //heart編集も多分データ分析、取得はしそうやかんね、多分こういう最適化の積み重ねが
      //実際のばかなと・・。

      // メッセージの変更をリアルタイムに監視
      messagesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            if (data.remakeOption === 2) {
              // remakeOptionが2に変更された場合、該当のデータを削除

              //ここかな？
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
        //新しい時刻を登録する。
        const nowTime = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = firebase.firestore().collection('rooms').doc(this.roomId);

        docRef.get().then(() => {
        docRef.update({ workStartAt: nowTime }); // updateメソッドを使用
        } )
        //リメイク処理開始
        this.remake();
      })
    },
  
    remakeCancel(){
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

      //原因はこの関数だった。でも理由がほんまわからｎ
      //多重関数の型だから・・？時間かけたわりに、答えがほしい
      //今のと違うところ洗い出しでいけるはずおもう


      //これが不足してたんやわ・・！！削除処理なかったから、テスト環境において一度やったらもう永続保持気味やった・・
      //くっそう。。見落としてたなあぁ完全、１かけ、これでも大分てをやいてました。。ぐう。
      //サブミットで毎回？？→いやタイマーからのモーダル判定でこれ使うの、重複してる、成立しないのかも

      //レポート保有のまま次のマッチング手続き参加するのあってはならないことなんやわ
      //でもってそれ、正式退出処理→リムーブ、しかなくて、その退出処理がないから
      //有効なリムーブ手段が今取れない、そうだから1回取得してしまうともう詰んでて例のモーダル出現要件をみたせなかったんやわ。
      //ならどうする。テスト環境、一旦退出ボタン備えるしかないか、そこ押したらリムーブでレポート削除する、それ徹底させる
      //んで本番環境では・・、途中抜け→復帰、2回目、このときセッション保有で破綻なのか。。
      //なら2回目だけケアでいいなら、本当の最小の入室把握（あーこれ、マッチング成立時に探索、が確実か？？
      //両方綺麗にする感じ。まあ2タブとか、誤作動押し→マッチングやと破綻にはなるか。
      //でも何か分岐させなあかんもんな。。一旦ならそうするか、、、ルートマッチング手続き完了でレポートクリアを踏む
      //これはまだマッチング部屋進行時、ボタンが押せないことに基づく（既存の1時間経過部屋が再度モーダル迫れられるから？
      //いや・・？保有中なら→タイマー処理停止中、それなくなっても問題ない？いやあるかＷいやタイマー完全に停止が
      //レポート所持要件のはずやから問題ないかも、よしならそこに組み込むか、テスト環境でも成立するはずやし、いこう、
      //(3タブ以外・？どやろ。タイマー静止ならいいはず。)
      

      
      this.checkInDialog = false
      
      

     this.scrollToBottom();
      
      //通常時のメッセージデータの格納
      let messagedata = this.body;
      //もし送信タイプがモーダルであったら、挨拶と作業内容にすり替える
      if (this.contents) {
        messagedata = this.greeting + this.contents;
      }
//原因はこいつ↓でした、なんでやねんｗ
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
      // falseにしてるはずなのに、閉じません、なんで。他の条件ないはずなのに・・
      //わからんわこれ、記録保存もされてるのに
      //場所適当に変えるか・・？
     
      // console.log("ダイアログとじろあほぼけ",this.checkInDialog)
      // this.checkInDialog =false
      // console.log("ダイアログとじろあほぼけ",this.checkInDialog)
//ここでの削除がほｔんど

//あーきみか(笑)、手早く再取得路線でいこか～～

     sessionStorage.removeItem('checkInKey');
    
     //初回以外であれば、作業記録として別のドキュメントにも保存
     
     //どうやらここがコードぶっこわしてたらしいですよ、なんじゃそれ
     if (!this.join) {
        this.contentsRecord();
      }

      // 2回目の入力完了記録
      //  if (this.stepIndex === 1) {
      //    sessionStorage.setItem('halfHourReported', 'true');
      //    this.halfHourReported = true;
      // } 
      
      //犯人こいつみたいでしたよ↓
       if (this.stepIndex === 2) {
        // お疲れ様モーダルの表示と特定の処理

        
         this.checkOutDialog = true;

        this.textAreaStatus = "メッセージを入力してください"
        this.oneHourReported = true;

        //ここただしいかわからないのと、indexも恐らくセッション管理しないと、
        //インデックス取得直後（モーダル表示処理稼働→その時いなければorF5→インデックス消失
        //でタイマー止める術、1時間経過証明する術なくなる思うので・
        sessionStorage.setItem('oneHourReported', 'true');

        //やば。。。まさかのこのstepIndexが犯人かよ、、、なにそれ、全く思い当たる節ないんやが
        //一番最後やぞこれ
         this.stepIndex = 3;
        console.log("なんで")
      }
    },
    
              
    observeMessagesAndGet(){

      // メッセージデータの分類と習得

      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

      // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
      roomRef.collection('messages').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach( change => {
            // いいね機能に備えた、messages配列へid属性の付与
            const newMessage = {
              id: change.doc.id,
              ...change.doc.data()
            };

        // newMessageのcreatedAtをDateオブジェクトに変換
        const createdAtDate = new Date(newMessage.createdAt.seconds * 1000);

        // DateオブジェクトをYYYY/MM/DD/HH/MM形式の文字列に変換
        const formattedCreatedAt = `${createdAtDate.getFullYear()}/${createdAtDate.getMonth() + 1}/${createdAtDate.getDate()} ${createdAtDate.getHours()}:${createdAtDate.getMinutes()}`;

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
        // いいね機能、編集されたデータのインデックスを取得
        else if (change.type === 'modified') {
          const index = this.messages.findIndex(message => message.id === newMessage.id);
          // リメイク申請者が、承諾されたことを把握
          if (index !== -1 && newMessage.remakeOption === 2){
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
    },
    
    

    async FriendApply(index){
      console.log("多分これfalse強制評価、左にメソッド評価式対応しとらんぽいもん")
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