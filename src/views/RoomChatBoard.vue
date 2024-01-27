<template>
  <v-app id="inspire">
    <SidebarSum />
    <div id="app">
      <h2>入室者リスト</h2>
      <ul>
        <!-- 入室者のステータスを管理 -->
        <!-- keyエラーでたのでindexをv-forに追加 -->
        <li v-for="participant in participants" :key="participant.index">
          <p v-if="participant.status"><span style="color: red;">{{ participant.name }}</span>
            {{ (participant.stayTime <= 0 ? 0 : participant.stayTime) + "分" }}</p>
        </li>
      </ul>
    </div>
    <v-main>
      <h1>{{ room.name }}</h1>
      <h3></h3>
      <v-card max-width="300" outlined shaped>
        <v-avatar color="grey lighten-2" size="79">
          <v-img max-height="123" max-width="250" :src="room.thumbnailUrl"></v-img>
        </v-avatar>
        <v-btn to="/">退出する</v-btn>
      </v-card>       
      <!-- ここからチャット画面要素 -->
      <v-container class="py-8 px-6" fluid>
        <v-row>
          <v-col >
            <v-card>
              <v-subheader></v-subheader>
              <div  class="chat-window">
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <v-list-item :key="index">
                     
                        <v-menu bottom min-width="200px" rounded offset-y>                        
                          <template v-slot:activator="{ on }">
                            <v-btn icon x-large v-on="on" >
                              <v-badge dot :color="getBadgeColor(data.name)" overlap>  
                                <template v-slot:badge>              
                                </template>                          
                              <v-list-item-avatar color="grey darken-1">
                                <v-img :src="data.photoURL"></v-img>
                              </v-list-item-avatar>
                            </v-badge>
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
                                <p class="text-caption mt-1"> </p>
                                <v-divider class="my-3"></v-divider>
                                <v-btn v-if="!isMyMessage(data)"  depressed rounded text @click="handleClick(data, index)">
                                  <!-- 一応ここが要修正になります、handleと非同期で初期に確定でいけそうやけどな、messagesに足す感じで -->
                               {{ data.isFriend ? '個人チャットに移動する' : 'フレンドを申請する' }} 
                              </v-btn>
                              <v-divider class="my-3" v-if="!isMyMessage(data)"></v-divider>
                              <v-btn depressed v-if="!isMyMessage(data)" @click="toProfile(data,index)" rounded text>プロフィールを参照する</v-btn>
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
        <v-textarea v-model="body"  append-icon="mdi-comment" class="mx-2" label="メッセージを送信する" rows="3" auto-grow>
        </v-textarea>
        <v-btn icon :disabled =false >
              <!-- <v-icon :color="heartStatus ? 'red' : 'grey'" @click="toggleHeart"> mdi-heart</v-icon> -->
              </v-btn>
        <v-btn class="mr-4" type="submit" :disabled="submitInvalid" @click="submit">
          送信する
        </v-btn>
        <v-btn @click="clear">
          削除する
        </v-btn>
        <!-- <v-btn @click="textFormActivate">ボタン</v-btn> -->
        <v-chip v-if="chip4"  class="ma-2" close color="orange" label outlined @click:close="chip4 = false" >
          早速挨拶をして、作業を開始しましょう。
        </v-chip>
      </v-main>
    </v-app>
  </template>
  
<script>
import firebase from "@/firebase/firebase";
import SidebarSum from "@/components/layouts/SidebarSum.vue";
import chatMixin from '@/mixins/mixin.js';
// import MenuBar from '@/components/layouts/MenuBar.vue';

export default {
  components: { SidebarSum},
  mixins: [chatMixin],
  data: () => ({
    checkInDialog: true,
    messages: [],
    participants: [],
    chip4: true,
    heartStatus:false,
    userDocId:"",
    myUserListId:"",
    auth: null,
    body: "",
    friendids:"",
    pairRoomId:"",
    room: [],
    roomId: "",
    applyName: "",
    cards: ["Today"],    
  }),
  beforeDestroy() {
  //ページ遷移時の検知に対応する
  const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");
  roomParticipantsRef.child(this.auth.displayName).set(false)

  clearInterval(this.intervalId);
  },
//なぜデータ取れるときと取れないときがあったか。それは認証システムが発動してるかどうかであった
//ファイル更新であればfirebaseリスナー働くが、普通のf5では更新維持のまま。なので取得誤りで条件によって損失かと
  async created() {
    //ストア損失で締めかな。

    //結論？？ストア消失→いやちゃう、appのストア取得が間に合ってないんやわ。
    //await輸出？（あとこのコンソールちりばめて問題の箇所特定するのつよいかもｗ
    //とにかく目立つ文字列並べまくってね

    //何この設計えぐｗなんでうごくねん力技ちゃうんかいｗｗ
    //すんごいアクション定義してます、読みとくかちはありそうやが。。
    //でもコンポーネント間での非同期そんなむずいんか・・？ｗまあすなおに
    //こっちに書いたらええ話しなんやけどね、折角勉強したのもあって興味もってしまいました・・・

    //vuex内でリフレッシュ等認証変更毎に非同期でユーザー情報を取得して
    //それをこちらのコンポーネントで取得するための手続き。大分高難易度になります・・
    //ほかでも遭遇しそうですこしこわいっす・・
    //consoleまでの、this.$storeに値の確定をさせる手続き（詳細vuexかなと）

    //try/catch構文はthen/catchとぼちぼちにてる。try,catchは意外にも同期処理らしい、
    // なので汎用性は高いけど中に更にawaitを非同期時かかなあかんから悩む？
    try {
      await this.$store.dispatch('checkAuthState');
      console.log("vuextesaaaaaaaat", this.$store.state.auth);
    } catch (error) {
      console.error(error);
    }


    console.log("vuextesaaaaaaaat",this.$store.state.auth)

    this.auth = JSON.parse(localStorage.getItem('user'));
    console.log("sessiontest多分なくなってる",this.auth)

    this.roomId = this.$route.query.room_id;

    // 画像、ルーム名を取得する
    const roomRef = firebase.firestore().collection("rooms").doc(this.roomId);
    const roomDoc = await roomRef.get();
    this.room = roomDoc.data();

    // 部屋の各種情報を取得、更新
    this.getMemberStatus();
    this.fetchRoomMembers();
    this.updateMemberStayTime();
    this.observeMessagesAndGet();
    },
  methods: {
    
    getMemberStatus(){ 

      // ルームの参加者リストを保存するための参照を取得
      const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");

      // 切断確認でオフラインに更新
      console.log(this.auth.displayName,"membaerstase起因？？")
      roomParticipantsRef.child(this.auth.displayName).onDisconnect().set(false);

      // 接続確認でオンラインに更新
      const connectedRef = firebase.database().ref(".info/connected");
      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          roomParticipantsRef.child(this.auth.displayName).set(true); // ユーザーをルームの参加者リストに追加
        }
      });
      // ページが閉じられる前にステータスを更新
      window.addEventListener("beforeunload", () => {
        roomParticipantsRef.child(this.auth.displayName).remove(); 
      });
    },
    updateMemberStayTime(){

      const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");

       // 入室時間を記録
       let enterTime = Date.now();

// 一分ごとに滞在時間を更新
this.intervalId = setInterval(() => {
  let stayTime = Date.now() - enterTime;
  stayTime = Math.floor(stayTime / 1000 / 60);
  
  // データベースに滞在時間を書き込む
  roomParticipantsRef.child(this.auth.displayName).child('stayTime').set(stayTime);
}, 60 * 1000); 
},

    fetchRoomMembers() {
      const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");
      // ルームの参加者リストを取得
      roomParticipantsRef.on("value", (snapshot) => {
        this.participants = [];
        snapshot.forEach((childSnapshot) => {
          // 参加者の名前とステータスをオブジェクトとして保存
          this.participants.push({
            name: childSnapshot.key,
            status: childSnapshot.val(),
            stayTime: childSnapshot.child('stayTime').val()
          });
        });
      });
    },
    getBadgeColor(username) {
      let participant = this.participants.find(participant => participant.name === username);
      return participant && participant.status ? 'green' : '#808080';
    },
  },
}
  </script>
  
  <style>
  .message {
    text-align: left;
    white-space: pre-wrap;
  }
/* もれてる */

  .half-size {
  transform: scale(0.5);
}
  </style>
  