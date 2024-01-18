<template>
  <v-app id="inspire">
    <SidebarSum />
    <div id="app">
      <h2>入室者リスト</h2>
      <ul>
        <!-- 入室者のステータスを管理 -->
        <li v-for="participant in participants" :key="participant">
          <p v-if="participant.status">{{ participant.name}}{{participant.stayTime+"分" }}</p>
        </li>
      </ul>
    </div>
    <v-alert dense text type="success" v-if="this.joinmessage">
    </v-alert>
    <v-main>
      <h1>{{ room.name ? "ルーム名:" + room.name : "" }}</h1>
      <v-chip v-if="room.time">
        {{ "    " + room.contents + ":残り" + this.roomTime+ "分" }}
        <v-icon right>mdi-clock-time-eight</v-icon>
      </v-chip>
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
          <v-col v-for="(card) in cards" :key="card" cols="12">
            <v-card>
              <v-subheader></v-subheader>
              <div  class="chat-window">
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <v-list-item :key="index">
                      <v-menus>
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
                      </v-menus>
                      <!-- メッセージ部分の記述 -->
                      <v-list-item-content>
                        <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-divider v-if="n !== 6" :key="`divider-${index}`" inset></v-divider>
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
        <v-btn class="mr-4" type="submit" :disabled="invalid" @click="submit">
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
  // import MenuBar from '@/components/layouts/MenuBar.vue';
  
  export default {
    data: () => ({
      dialog: false,
      checkInDialog: true,
      messages: [],
      participants: [],
      chip4: true,
      btn: false,
      users:"",
      heartStatus:false,
      userDocId: "",
      auth: null,
      body: "",
      room: null,
      roomId: "",
      applyName: "",
      //なんでかここデータ必要みたい。。カード情報
      cards: ["Today"],
      drawer: null,
      joinmessage: "",      
      user: {},
    }),
  beforeDestroy() {
  //ページ遷移時の検知に対応する
  const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");
  roomParticipantsRef.child(this.auth.displayname).set(false)

  // タイマーを停止
  clearInterval(this.intervalId);
},

async created() {
  this.auth = JSON.parse(sessionStorage.getItem('user'));
  
  this.roomId = this.$route.query.room_id;
  // 部屋情報（画像、ルーム名）を取得する

  const roomRef = firebase.firestore().collection("rooms").doc(this.roomId);
  const roomDoc = await roomRef.get();
  if (!roomDoc.exists) {
    await this.$router.push('/');
  }
  this.room = roomDoc.data();
  
  // -----参加者のステータス管理------

  // ルームの参加者リストを保存するための参照を取得
  const roomParticipantsRef = firebase.database().ref("rooms/" + this.roomId + "/participants");

  // ユーザーがオフラインになったときにステータスを更新
  //onDisconnectのあとにchildは置けない、child=現在の参照から子を参照する
  roomParticipantsRef.child(this.auth.displayname).onDisconnect().set(false);

  // 接続が確認されたら、オンラインステータスがセットされる。
  const connectedRef = firebase.database().ref(".info/connected");
  connectedRef.on("value", (snap) => {
    if (snap.val() === true) {
      roomParticipantsRef.child(this.auth.displayname).set(true); // ユーザーをルームの参加者リストに追加
      console.log("connected");
    }
  });

  // ページが閉じられる前にステータスを更新
  window.addEventListener("beforeunload", () => {
    roomParticipantsRef.child(this.auth.displayname).remove(); // ユーザーをルームの参加者リストから削除
  });
  // ルームの参加者リストを取得
  this.fetchRoomMembers();


  //------参加者の滞在時間管理----------

  // 入室時間を記録
  let enterTime = Date.now();

  // 一分ごとに滞在時間を更新
  this.intervalId = setInterval(() => {
    let stayTime = Date.now() - enterTime;
    // 滞在時間をミリ秒から分に変換
    stayTime = Math.floor(stayTime / 1000 / 60);
    
    // データベースに滞在時間を書き込む
    roomParticipantsRef.child(this.auth.displayname).child('stayTime').set(stayTime);
  }, 60 * 1000); // 60 * 1000 ミリ秒 = 1分
  },
  async mounted() {

    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
    
    // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
    roomRef.collection('messages').orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          // 後にforに展開するために、messages配列に格納(配列代入につきpush)
          this.messages.push(change.doc.data());                     
        });
      });
  },

  methods: {

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

  toggleHeart() {
    this.heartStatus = !this.heartStatus; // ハートの点灯状態を切り替え
  },

  clear() {
    this.body = "";
  },

  scrollToBottom() {
    const chatWindow = document.querySelector('.chat-window');
    chatWindow.scrollTop = chatWindow.scrollHeight;
  },

  submit() {
    let messagedata = this.body;
    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
    //送信者の情報、メッセージ内容をアップロードする
    roomRef.collection('messages').add({
      message: messagedata, 
      name: this.auth.displayname,
      photoURL: this.auth.photoURL,
      createdAt: firebase.firestore.Timestamp.now(),
      userId: this.auth.uid,
    })
    .then(()=> { 
      this.scrollToBottom();
      this.body = "";
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
  .half-size {
  transform: scale(0.5);
}
  </style>
  