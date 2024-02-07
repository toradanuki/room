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

    //あれまじでわからんかも？？
    //なんでや。store損失時にエラーかな？？？
    //store発火をonAuthにしてるから、再認証ともわないstore損失アクション→
    //ただデータだけ失う。セッションストレージ寄り脆くローカルもないのでつみ？？
    


    //ここがあかんみたい受け取りミス、なるへそ命名じゃなくてこっちのほうなのか。
    this.auth = this.$store.state.auth
    // thisauthが破損？？なんで＿？？やめよかな・・
    //ぎゃあ。。まさかのこっちがケースによってデータ損失らしいです。。。つら。。
    //そうするとstuore脆弱すぎません？？sessionしか勝たんぞそれ？？？

  //いや初期代入かごめんｗそれやったかも、多分同等ちゃうかった？？保持性能

    console.log("vuextestぜんぶなしまじ？？",this.$store.state.auth,this.auth,this.auth.displayName)
    // this.auth = Vue.prototype.$store.state.auth;

    //あれ結局なんかとおってやめたよな。データいざ確認したら発見して、→なんやねんならdisplayNameでええやんけっ！！てｗ
    //まあもともと大文字小文字なくすために削除するやつを、放置したままやったからなんやけどね、うむ
    //ならログイン情報落とした感じかな今

    //なあ順番問題みたいやぞ。チャットの描画先か、auth受取先か。みたいなね
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
        snapshot.docChanges().forEach( change => {
          // messages配列へ特定用id属性の付与
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
        this.notifyEndKey = sessionStorage.getItem('notifyEndKey');
        sessionStorage.removeItem('checkInKey');

        // 初回以外の作業内容の動機
        if(this.contents && !this.checkInKey){
          this.workContentsRecord();
          }
        // 終了モーダルへの移行
        if(this.notifyEndKey) {
          this.notifyEndKey = false
          sessionStorage.removeItem('notifyEndKey')
          sessionStorage.setItem('restartBtnKey','true');
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

      //下がりきらないので修正
      chatWindow.scrollTop = chatWindow.scrollHeight + 200;
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
          querySnapshot.forEach(doc => {
            dataArr.push(doc.data());
          })
          const  data2 =dataArr[index]
          const{name}=data2
          this.applyName = name
        })

      //取得した申請先のアカウント名をもとに、userlistから当該ドキュメントのidを取得
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
      //現在壊れております。trueを返しております。
      //うん？？ｗｗいやちゃうかｗ
      async isFriend(opponentData){
        let result = false;
        const querySnapshot = await firebase.firestore().collection("userlist").where("displayName", "==", this.auth.displayName).limit(1).get();
        // asyncで非同期関数にする。非同期関数はpromiseをセットで返してくるよ。なのでmapメソッドはpromiseを含んだ配列を返してくるよ
        // mapは各要素に対してくり返し処理をして配列を作るよ。作ったPromise配列はPromise.allに渡されることで、すべての処理が終わるのを
        //まつことができるよ。そしてawaitはasync関数内で使う事ができるよ。awaitでPromiseの解決をまつことができるよ。（Promise.allと近いのかな？）
        // Promiseは非同期操作の結果を表現するオブジェクトだよ、成功したら戻り値でresolveされるよ（消失ってことかな？？）
        // asyncはほぼすべての関数に使用することができるよ。つまり非同期化できるってことだね。asyncawaitを用いることで、非同期コードを
        //同期コードのように書くことができるよ（これが本命？？）、可読性と理解性が優れているから強力だよ
        //このコードでは、まずasyncがコールバック関数全体（doc引数のアロー関数かな）にかかって非同期関数化してるよ。
        // そして引数docにpromiseを一つ一つ付け加えあげるよ。..?Promiseはどこに加わっているのだろう。
        //非同期関数化しているのはmap内のコールバック関数全体見たいかも。
        //awaitキーワードを使う事で、それ以降の処理を中断できるよ。これは↑から順にコードが実行されるから一見の普通のことだけど、javascriptでは設計上
        //時間のかかる関数処理とかあったら飛ばして下のコードが先に実行されることがあるよ。だから想定と違う動きしてしまうことがあるよ、それがあると
        //コード管理や可読性が落ちるのと予期しない動きが生まれるよ。そしてそのコードの実行順が狂うのはデータベースなどの操作処理があたるよ。このせいで
        //そのままコードを欠いた時に、いわばjavascriptのある意味欠陥で予期せぬ不具合をおこしてしまうよ。だからそれを自然にするために、時間のかかる処理に
        //対しては上から実行を維持してエラー出さないために非同期処理というものを追加してあげる必要がでてくるよ。その一つの追加できる処理の仕方がこの
        //asyncawaitだよ。いやえぐ衝撃な概念ありすぎなんやけどｗｗｗｗちょっと書き足して整理するわこのままｗｗ
        // awaitはコードの実行順を整えるといったけど、その中身にはPromiseというオブジェクトが関わっているよ。そもそも時間がかかって実行順がずれる
        //のような関数(API,ここでのデータベース操作メソッド）は、基本的にPromiseをもとから返すようにできてるよ。そしてそのPromiseオブジェクトは、
        //処理の結果をデータで表現してくれるよ。具体的には、"成功可否"＋"取得された値"(+その他)で構成されているよ。そして話を戻すとawaitは、
        //Promiseが成功か失敗のデータになるまで処理をとめるよ。（Promiseを返さない関数につけてもエラーは一応はかないよ）
        //つまりPromiseをつかって本来の処理の順番をつらぬこうとしてくれるから、予期しないエラーを防いだり可読性を上げることに繋げらえるよ
        //もちろんこれまで通り実行順がずれても構わないところは、返されるPromiseをスルーしてもらってかまわないよ。


        //非同期操作、jsの仕組みをさっきはけなしたけど、ある意味で優れているともいえるよ。だってコード順の実行を完璧に守ろうとすると、遅い処理が一個
        //あって、それがただ遠い人との通信が届くのを待つ行為であったら、時間の無駄でしかなくなるよ、だからもっと上手く時間使うために備わった処理設計
        //ともいえるよ。ながらそれを場合に応じて元のように手作業で指示してくださいっていうのがこのjsだと思うよ。
        //非同期設計はだからメリットの面で語られてると考えることもできるよ。
        const promises = querySnapshot.docs.map(async (doc) => {
          this.myUserListId = doc.id;
          const friendListSnapshot = await firebase.firestore().collection('userlist').doc(this.myUserListId).collection('friends').where('name', '==', opponentData.name).limit(1).get();
          //awaitでここからの処理、実行を、APIの通信からデータ取得完了するまで停止させるよ。上から順の実行を貫いてもらうよ。
          result = !friendListSnapshot.empty;
        });
      // オリジナルのPromiseをつけてあげるよ、 querySnapshot.docsはそのままPromiseを返してくれない、持っていないからね
      //awaitをつかってreturnが先に動作するのを↑と同じようにとめてあげてるよ。ここから考え方として、何か処理を遅延、
      //↑から順にしっかり処理してほしいときは、まずその一つ上にawaitを含んだコードをなんか適当に付け加える方法を考えて
      //そのための環境づくりとして、一つ↑の階層にasyncだったり、Promiseもらえなかったら自分でPromise付け加えちゃったりしちゃう感じだよ
      // 物凄い勉強なったわｗｗｗほんとやってよかったかもこれ向き合って。永遠の課題これにてやっと解決したわｗ
      //んで理解したからこそいえるねんけど、これ口頭で教えてくれる人いたら一発で理解できる気がするけど・・・ｗやっぱ書籍とかやと
      //難しいのかなぁ？それか文脈とかの差なんですかなぁ。伝えれる自身あるけどなぁ同じレベル感の人にさ、うんーーどうなんやろかぁ
      //教え方、？についても興味をもったいっけんやったなぁ。。笑

      //Promise.all関連少し感知ギア。promisesは既にpromiseをもってたみたい。これ結構むずいことしてたんやなｗｗ
      //asyncawaitは多重構造をもてること。Promiseを自分で作るやり方として、関数にasyncを加えてあげること。そう、なんとそうすれば
      //"その関数はPromiseを返してくれるようになります！！！"めっちゃすごいやん。なるほど、そうやってしてオリジナルPromiseをつくれるんか！
      //そしてそして。Promise.allは、その配列に含まれた沢山のPromiseを一個にセットにしちゃう！！それどういう意味かっていうと、そもそも
      //Promiseが処理の進捗状況と値を表すオブジェクトってことやったけど、それがいっぱいあると困っちゃうみたい。
      //どれか一個おわったら完了とするか、全部なのか。やからPromise.allで、中身のPromiseが全部"作業終わりました!"って状態になったら、
      //改めてその全体の完了を示すPromiseを一つ返してもらうようにするかんじです！はい！（達成をちなみにfullfiedというらしいよ）
        await Promise.all(promises);
        return result;
      },
    async handleClick(data, index) {
    const isFriend = await this.isFriend(data);
    if (isFriend) {
      this.toPairRoom(data);
    } else {
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