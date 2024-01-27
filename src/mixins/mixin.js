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
    console.log(this.auth,"稼働はしてる")
    // this.auth = JSON.parse(localStorage.getItem('user'));
  },
  methods: {
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
          this.scrollToBottom();
        }
        // 通常のメッセージであれば、メッセージとして反映
        else if (change.type === 'added') {
          const isFriend =  await this.isFriend(newMessage);

          if (isFriend){
              // 新規メッセージ(newMessage)がフレンドのものであれば、isFriendプロパティを加え
              // trueをセットする($setでは第二引数に、プロパティ名orインデックスを指定)
              this.$set(newMessage, 'isFriend', true);    
          }
          this.messages.push(newMessage);
          this.scrollToBottom();
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
      
      this.scrollToBottom();
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
          localStorage.removeItem('notifyEndKey')
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
    scrollToBottom() {
      const chatWindow = document.querySelector('.chat-window');
      chatWindow.scrollTop = chatWindow.scrollHeight 
    },
    clear() {
      this.body = "";
    },
      //--------------Friend系機能-----------------

    async FriendApply(index){
      console.log(index,"index check")
      const roomRef =  firebase.firestore().collection('rooms').doc(this.roomId);
      let dataArr = [];
      await roomRef.collection('messages').orderBy('createdAt','asc').limit(index+1).get()
        .then(querySnapshot => {
          //なんや？？ここがわりとバグっとるんか？？はえ・・？
          //3つを3回取得ってどういうことやｗ
          querySnapshot.forEach(doc => {
            dataArr.push(doc.data());
            console.log(dataArr,"datacheck")
          })
          const  data2 =dataArr[index]
          const{name}=data2
          this.applyName = name
          console.log(this.applyName,"datacheck2")
        })

      //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得
      // this.auth.displayNameが相手の混じってしまっとる模様。・？
      // 逆やった、applyNameが自分のなっとるんやわ
      console.log(this.auth.displayName,"check")
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
        console.log(result,"ts",await Promise.all(promises),)// result=false,false =,空・。
        return result;
      },
    async handleClick(data, index) {
    const isFriend = await this.isFriend(data);
    if (isFriend) {
      this.toPairRoom(data);
      // falseで走るはずちゃうかった＞＞??elseちゃうかった・・？
    } else {
      //indexエラー説？
      console.log("フレンド申請",index)
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