<template>
  <v-app id="inspire">
    <SidebarSum />
    <v-alert dense text type="success" v-if="this.joinmessage">
  <!-- {{ joinmessage }} -->
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

  <v-alert dense type="info" v-if="logstack"></v-alert>
  <!-- ここからチャット画面要素 -->

  <v-container class="py-8 px-6" fluid>
    <v-row>
      <v-col v-for="(card) in cards" :key="card" cols="12">
        <v-card>
          <v-subheader></v-subheader>

          <!-- この↑の部分の記述不要では。。？恐らくメッセージ画面コンテナ複数用、でも一つでいいはず、cards
          は中身today＋0 を取るだけだからね、うんうん、時間でボックス分けるつもりないし、あーでも送信時刻のせる
        のはありかも。・・？data.timestampをmessageの横に記すのありかも、灰色でね～。 -->

          <v-list two-line>
            <template v-for="(data, index) in messages">
              <!-- ここのtemplateタグ然り、プロパティ何か与えたいときに取り敢えずディレクティブとしてのtemp..? -->
              <v-list-item :key="index">

                <v-menus >
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
                </v-menus>
                       <!-- メッセージ部分の記述 -->
                <v-list-item-content>
                  <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
                </v-list-item-content>


              </v-list-item>
              <v-divider v-if="n !== 6" :key="`divider-${index}`" inset></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <!-- チャット画面要素以上 -->
  <v-textarea v-model="body" append-icon="mdi-comment" class="mx-2" label="メッセージを送信する" rows="3" auto-grow>
      </v-textarea>
     
      <v-btn class="mr-4" type="submit" :disabled="invalid" @click="submit">
        送信する
      </v-btn>
      <v-btn @click="clear">
        削除する
      </v-btn>
      <v-chip
      v-if="chip4"
      class="ma-2"
      close
      color="orange"
      label
      outlined
      @click:close="chip4 = false"
    >
     早速挨拶をして、作業を開始しましょう。
    </v-chip>
    
  </v-main>


<!-- 
  <v-container>
      <v-row>
        <v-col cols="12" class="text-center">
          <v-card class="mx-auto" outlined>
            <v-card-text class="display-4">{{ this.roomTime?"残り"+this.roomTime+"分" :"" }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container> -->

  </v-app>
</template>


  
<script>
import firebase from "@/firebase/firebase"
import SidebarSum from "@/components/layouts/SidebarSum.vue";


export default {
  async created() {
    this.roomId = this.$route.query.room_id;
    const roomRef = firebase.firestore().collection("rooms").doc(this.roomId)
    const roomDoc = await roomRef.get()
    if(!roomDoc.exists){
      await this.$router.push('/')
    }
    this.room = roomDoc.data()
    console.log(this.room,"this room called")
    
  },
  async mounted(){


   







//クエリパラメータより、滞在中のページを識別し、振り分ける処理。取得したパラメータより
//適切な内部データを抽出し、単一のviewから個々のページを展開できる。
this.roomId = this.$route.query.room_id;

//設定された時間を取得

   await firebase.firestore().collection("rooms").doc(this.roomId).get()
 .then((doc) =>{
  const data =doc.data()
   this.roomTime =data.time
  console.log(data)
  console.log(this.roomTime)
})
.catch((error)=>{
console.log(error,"getdata failed")
})

console.log(this.roomTime)

//60000ms(60s)毎に設定時刻から"--",1減算していく処理。カウントダウンタイマーの実装


// if(this.roomTime){....ブロックスコープ内での関数宣言(if文)はEslintルール違反



    const timerId =setInterval(() => {
      counting(this)
      }, 60000);
      //thisのオブジェクト管理

      function counting(vm){

        vm.roomTime --
        console.log("interval",vm.roomTime)
        if (vm.roomTime === 0) {
        // alert("タイマーが0になりました");
        clearInterval(timerId)
      }

      }
    
 


  //**thisとインスタンスについて**
  
  //アロー関数で、スコープをバインドしてthisの値を明示的に指定する必要をなくせてる？本来bind不可欠
  //thisは呼び出し元のobj参照、なのでコールバックで渡す時意図しない動作しうる→参照先を確定させたい。
  //仮に、roomClose(this).bind(objA)という表記なら、thisはdataを持ったvue"インスタンス"(→クラスから
  //生成された"オブジェクト!!!")では無く"objA"を参照してしまい、dataの値が使えなくなる。

// ?による条件分岐。?の左が真なら左辺、偽なら右辺を返す。
//よって時刻が設定されてない部屋の期限を解消できる

const result =  this.roomTime  ? this.roomTime :999



  setTimeout(() => {
  roomClose(this);
}, result *60*1000);

//Gl objをとるsetTimeout内でのthisは、dataを含んだvueインスタンスを指せないので、慣例的に使用される"vm"(ViewModel)
//という命名で作成した変数vmに、vueobj(インスタント)を指したthisを引数として渡してあげることで、これまでと同様な挙動を取れる。
//


//既定時間に達した際の退出処理

function roomClose(vm) {
  console.log(vm.roomTime);
  alert("設定された時間に達しました。部屋を退出します");
  vm.$router.push("/")
}


    this.auth= JSON.parse(sessionStorage.getItem('user'))
    console.log("user",this.auth)

    const  roomRef = firebase.firestore().collection('rooms').doc(this.roomId)
    console.log('mounted.doc作動')

    //メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
    
    roomRef.collection('messages').orderBy('createdAt','asc')
    .onSnapshot(snapshot =>{
      snapshot.docChanges().forEach(change => {

        //後にforに展開するために、messages配列に格納(配列代入につきpush)
        
        this.messages.push(change.doc.data())

      })
    } )

    if (localStorage.message) {
            this.joinmessage = localStorage.message
            localStorage.message = ''

        }

   
},
  data: () => ({
    dialog:false,
   
    messages: [
      
    ],
    
    chip4: true,
    btn:false,
    logstack:"",
    userDocId:"",
    roomTime:"",
    timer:5,
    auth:null,
    body: "",
    room:null,
    roomId: "",
    applyName:"",
    cards: ["Today",],
    drawer: null,
    joinmessage:"",
    links: [
      ["mdi-inbox-arrow-down", "Inbox"],
      ["mdi-send", "Send"],
      ["mdi-delete", "Trash"],
      ["mdi-alert-octagon", "Spam"],
    ],
    user: {
        
      },
      return:{
        
        chip4: true
      }
     
    // invalid: false
  }),

  computed: {
   

    invalid() {
      if (!this.body) {
        return true;
      }
      return false;
    }
  },
  methods: {
    clear() {
      console.log("clear call.");
      this.body = "";
    },
    submit() {
      console.log("submit call.",this.body)


       const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

       //送信者の情報、メッセージ内容をアップロードする
      
  
      roomRef.collection('messages').add(
         { message: this.body, 
           name: this.auth.displayname,
          photoURL: this.auth.photoURL,
         createdAt: firebase.firestore.Timestamp.now(),
         userId: this.auth.uid,
         
       }
       )
      .then(result => {
        console.log('success', result)
        this.body = "";
      })
      .catch(error =>{
        console.log('fail',error)
        alert('メッセージの送信に失敗しました。')
      })
     

    },

    //forで指定したindexを引数として渡し、押下されたbtnを識別する、
    async FriendApply(index){


      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);

      let dataArr = [];
      //firebaseでは配列の取得が基本のため、目的のデータを含んだ配列objとしてまず取得。

      await roomRef.collection('messages').orderBy('createdAt','asc').limit(index+1).
     get().then(querySnapshot => {
   querySnapshot.forEach(doc => {
    
     //forEachでデータを回して、pushで用意した配列に渡す

     dataArr.push(doc.data());
     

     console.log(dataArr)
    

   })
   //forEach処理を完了させるべく波括弧外に次のデータ受け渡し処理記述
    //配列の中から任意のデータをindexで抽出、配列(配列obj)における分割代入式
   
    const  data2 =dataArr[index]

    //data2は配列オブジェクトの型につき、キー"name"より値を取得する記述式

   const{name}=data2

   console.log(name)

      //リクエスト申請者の名前を取得

   this.applyName = name

})

    console.log("check",this.applyName)

    //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得

     firebase.firestore().collection("userlist").where("displayname", "==",this.applyName)
    .get()
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
        status:"off" 
       }
       )
      .then(result => {
        console.log('success', result)
        this.body = "";
      })

        });
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });

    }

},
  
  components: { SidebarSum }
  
}


</script>

<style>
.message {
  text-align: left;
}
</style>

