// mixin.js
import firebase from 'firebase';
// import Vue from 'vue';

export default {
  data: () => ({
    auth:"",
    }),
  computed:{
    submitInvalid() {
    if (!this.body) {
      return true;
    }
    return false;
    },
  },
  mounted(){
    //ここか？リメイク失敗、特殊リロードにつき
    this.auth = this.$store.state.auth
     
 
  },
  methods: {
      // いやまじで拍子抜けなんやが。。。一瞬で実装おわったんやが。。なんやそれｗ
    // こんな苦労したのに。。。。答えはv-menuに対する@inputやったか。。。なんやそれー。。。。
    // まあinput系いくつかあったけど。。これで早かったんか。。。
    // まあでも非同期当時それでもできてなかったけ・・・？forEachいてレート？とか処理の遅さによる弊害など
    // 多くは目の当たりにできたから、まあ勉強になったとは言えますかな・・・ぐす。。
    async checkIsFriend(data){
      console.log('鬼門のメニュー展開検知',data)
      const isFriend = await this.isFriend(data);
    this.$set(data, 'isFriend', isFriend);

    },
    textAreaRules(){
    if (this.$refs.form.validate()) {
      return true;
    }
    return false;
    },

    observeMessagesAndGet(){
    // メッセージデータの分類と習得
    const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);

    // メッセージコレクション内のデータの変更(動き、初期データ含む)を検知し取得する。
    roomRef.collection('messages').orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          // messages配列へ特定用id属性の付与
          // 内部的には、マウント時にデータを一つ一つ取得してnewMessageに渡す
          const newMessage = {
            id: change.doc.id,
            ...change.doc.data()
          };
        // newMessageのcreatedAtをDateオブジェクトに変換
        const createdAtDate = new Date(newMessage.createdAt.seconds * 1000);

        // DateオブジェクトをYYYY/MM/DD/HH/MM形式の文字列に変換
        // padStartで、1桁であれば先頭に'0'を追加
        const formattedCreatedAt = `${createdAtDate.getFullYear()}
        /${(createdAtDate.getMonth() + 1).toString().padStart(2, '0')}
        /${createdAtDate.getDate().toString().padStart(2, '0')} 
        ${createdAtDate.getHours().toString().padStart(2, '0')}
        :${createdAtDate.getMinutes().toString().padStart(2, '0')}`;

        // newMessageのcreatedAtを更新
        newMessage.createdAt = formattedCreatedAt;

        // 追加メッセージがリメイク申請であれば、そのdocIdを取得
        if (change.type === 'added' && newMessage.remakeOption === 1){
          this.remakeApplyDocId = newMessage.id
          this.messages.push(newMessage);
           this.$nextTick(() => {
             this.scrollToBottom();
            });
          // スケジュールさせるメソッド、内部的に非同期処理とされるリアクティブシステムのデータ変更検知
          //に基づいたDOMの更新を待つ必要があるときに、このメソッドが不可欠となる。

          //
          
           console.log("あれ？？remakeopiton/?")
        }
        // 通常のメッセージであれば、メッセージとして反映
        else if (change.type === 'added') {
          //isFriend判定を自分以外に施してみて大幅処理の効率化図れたけど、
          //そうするとかえって自分が早くなりすぎやった。。これどうしよかほんと・・
          //forEachである以上非同期挟んでも処理長い場合先に進んでしまう、かといって
          //for文系で一つ一つ非同期で検証した時あまりにも時間がかかってしまう、取得と比較に
          //そうすると。。。検証をローカルで行えるようにする・・？？
          //それか検証必要性を最小限にする→例のメニュー開くまでisMymessage系で特定するみたいな。
          //新しい$nexttickでなんとかならんかなぁ・・
          //メニューを開いたら→isFriendをnextTickでデータ確実にとってきて
          // 検証終わったらあからさまにあとから表記いじるみたいな・・？？どうやろうか。。
          //なんかもう見た感じデータ部分では厳しそうなんよな、検証量とか再整理など。。
          //可能性あってもかなり複雑そうな印象つよめゆえ。。
        
        
            // const isFriend = await this.isFriend(newMessage);
          

          // やはりどうやら、フレンド判定が優勢されて、フレンドのチャット内容が先に取得→描画されて
          //しまってる。再更新時に一気にその仕様になってしもてる。。どないするか。改めて並び替えなのか？？
          
          // 恐らく逆に自分のフレンド判定が遅れていると予想。ならそれをしっかり遅延させるか。。？
          //そんな単純でないとするなら（複合的）、一気にまとめて、時間参照に基づいて配列生成かな。。
          //それか例のfor文検証かなと。。前結局確か動作環境誤ってたような

          // if (isFriend){

              // 新規メッセージ(newMessage)がフレンドのものであれば、isFriendプロパティを加え
              // trueをセットする($setでは第二引数に、プロパティ名orインデックスを指定)


          //     this.$set(newMessage, 'isFriend', true);    
          // }
          this.messages.push(newMessage);
           this.$nextTick(() => {
             this.scrollToBottom();
            });
          
        } 
        // 対象データのインデックスを取得
        else if (change.type === 'modified') {
          const index = this.messages.findIndex(message => message.id === newMessage.id);
          // リメイク承諾であれば、リメイクを実施
          if (index !== -1 && newMessage.remakeOption === 2){
            this.remake();
          }
          // 'いいね'を検知
          else if (index !== -1) {
            //プロパティをリアクティブに更新するメソッド$set
            this.$set(this.messages, index, newMessage);
          }   
        }
        
      });
    });
  },
    submit() {
      
      // this.scrollToBottom();
      let messagedata = this.body;
      // マッチングチャット用処理
      if(this.isMatchingRoom){
        this.checkInDialog = false
        this.notifyEndKey = localStorage.getItem('notifyEndKey');
        localStorage.removeItem('checkInKey');

        // 初回以外の作業内容の動機
        if(this.contents && !this.checkInKey){
          this.workContentsRecord();
          }
        // 終了モーダルへの移行
        if(this.notifyEndKey) {
          this.notifyEndKey = false
          localStorage.removeItem('notifyEndKey','true')
          localStorage.setItem('restartBtnKey','true');
          this.restartBtn = true
          this.notifyEndOfSession();
        }
        if(this.greeting){
          messagedata = this.greeting + this.contents;
        }
      }

      //送信者の情報、メッセージ内容をアップロードする

      const roomRef = firebase.firestore().collection('rooms').doc(this.roomId);
      roomRef.collection('messages').add({
        message: messagedata,
        name: this.auth.displayName,
        photoURL: this.auth.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.auth.uid,
        heartStatus: false
      })
      .then(() => {
        this.body = "";
        this.greeting = "";
        this.contents = "";
        // this.scrollToBottom()
      })
      .catch(() => {
        alert('メッセージの送信に失敗しました。')
      })
    },
    isMyMessage(data) {
      if(this.auth.uid == data.userId){
        return true;
      }
    },
    toggleHeart(data) {
      // ハートのカラーを切り替え
      this.heartStatus = this.heartStatus === 'red' ? 'grey' : 'red'; 
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);

      roomRef.collection('messages').doc(data.id).update({ 
        heartStatus: this.heartStatus
      })
    },
    // チャット更新後のscrollHeightを取得しなければ、正しいスクロール幅は得られない。
    // よってthis.$nextTick()の利用が前提となる。
    scrollToBottom() {
       const chatWindow = document.querySelector('.chat-window');
       chatWindow.scrollTop = chatWindow.scrollHeight 
    },
    clear() {
      this.body = "";
      
    },
      //--------------Friend系機能-----------------

    async FriendApply(index){
      
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
      let dataArr = [];
      await roomRef.collection('messages').orderBy('createdAt','asc').limit(index+1).get()
        .then(querySnapshot => {
          //なんや？？ここがわりとバグっとるんか？？はえ・・？
          //3つを3回取得ってどういうことやｗ
          querySnapshot.forEach(doc => {
            dataArr.push(doc.data());
            
          })
          const  data2 =dataArr[index]
          const{name}=data2
          this.applyName = name
         
        })

      //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得
      // this.auth.displayNameが相手の混じってしまっとる模様。・？
      // 逆やった、applyNameが自分のなっとるんやわ
     
      firebase.firestore().collection("userlist").where("displayName", "==",this.applyName).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {  
            this.userDocId = doc.id
            const  userRef =firebase.firestore().collection('userlist').doc(this.userDocId)
            //相手のフレンド申請受信リストドキュメントに、自身のユーザー情報を格納
            userRef.collection('applicant').add({         
                createdAt: firebase.firestore.Timestamp.now(),        
                candidate:this.auth.uid,
                name: this.auth.displayName,
                photoURL: this.auth.photoURL,
                status:"off" ,
                opponentName:this.applyName
            })         
          });
        })      
      },
      async isFriend(opponentData){
        let result = false;
        const querySnapshot = await firebase.firestore().collection("userlist").where("displayName", "==", this.auth.displayName).limit(1).get();
        // docそれぞれにPromiseをasyncで与える
        const promises = querySnapshot.docs.map(async (doc) => {
          this.myUserListId = doc.id;
          // フレンド検証完了まで、結果の評価を待つ
          const friendListSnapshot = await firebase.firestore().collection('userlist').doc(this.myUserListId).collection('friend')
          .where('name', '==', opponentData.name).limit(1).get();
          result = !friendListSnapshot.empty;
        });
        // Promiseを１つにまとめて返す
        await Promise.all(promises);
        
        return result;
      },
    async handleClick(data, index) {
    const isFriend = await this.isFriend(data);
    if (isFriend) {
      this.toPairRoom(data);
      // falseで走るはずちゃうかった＞＞??elseちゃうかった・・？
    } else {
      //indexエラー説？
   
      this.FriendApply(index);
    }
    },
    toProfile(data){
      this.friendids = data.userId
      this.$router.push({ path: '/user', query: { user_id: this.friendids } })
    },
    async toPairRoom(pairName) {
      await firebase.firestore().collectionGroup('friend').where("name", "==", pairName.name).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            this.pairRoomId = data.pairRoomId;
          });
        });
      this.$router.push({ path: '/PairRoom', query: { room_id: this.pairRoomId } });
    },
  }
}