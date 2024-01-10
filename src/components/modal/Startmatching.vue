<template>
  <v-app>
    <!-- <app></app> -->
    <v-row justify="center">
      <div class="text-center">
        <v-progress-circular v-if="waitingKey" indeterminate color="primary"></v-progress-circular>
      </div>
     
            <v-btn @click="onSubmit" class="mx-2" fab dark large color="cyan" >
            マッチング
            <v-icon dark>mdi-pencil</v-icon>
          </v-btn>
      
    </v-row>

    <v-dialog v-model="matchAlert" max-width="290">
      <v-card>
        <v-card-title class="text-h5">{{ matchingMesseage }}</v-card-title>
        <v-card-text>部屋に参加します。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="join">はい</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-app>
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
    status: "start matching",
    createdRoomId: "",
    entryRoomId: "",
    joinRoomId: "",
    hostServer: "",
    valid: true,
    matchingMesseage: "",
    waitingKey:"",
    timeSelect:"",
  }),

  // サーバー有無の確認処理を、mountでなくmatching押下の段階で行えるようにすること。
  //厳密にはモーダルのonsubmit。
  mounted() {
  },
  methods: {
  //マッチング完了後のダイアログでの参加部屋振り分け処理。
    join() {
      if (this.joinRoomId) {
        this.$router.push({ path: '/chat', query: { room_id: this.joinRoomId } })
      }
      else {
        this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } })
      }
    },
    async onSubmit() {
      this.dialog = false
      this.status = "待機中"
      // let thumbnailUrl = ""
      //作成した部屋のサムネイル画像のアップロード
      // if (this.file) {
      //   const filePath = `/room/${this.file.name}`
      //   await firebase.storage().ref().child(filePath).put(this.file)
      //     .then(async snapshot => {
      //       thumbnailUrl = await snapshot.ref.getDownloadURL()
            
      //     })
      // }
      const roomRef = firebase.firestore().collection('rooms')

      //待機中の部屋があれば、そのドキュメントidを取得
      await firebase.firestore().collectionGroup('roomstatus').where("roomParameter", "==", 0).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            
            this.hostServer = doc.id
            
          })
        })

      //client側の処理、待機中の部屋があった場合
      if (this.hostServer) {
          //待機中の部屋 = 最も作成日時が新しいものが十分条件につき、降順(desc,)にソートし一つだけ部屋情報を取得
          
          //※日時における降順→新しい順番。日がたつほど、年,月,日,時刻の各値が大きくなるため。
          //descending ≒decrease,減少順として覚えやすいかも

        const docIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()

        docIdRef.forEach(doc => {
          this.joinRoomId = doc.id
          
        })

        //参加する部屋のステータスを変更することで、部屋を閉ざしつつ相手にクライアントの参加をつたえる。
        const roomParameterRef = roomRef.doc(this.joinRoomId).collection('roomstatus').doc(this.hostServer)
        return roomParameterRef.update({
          roomParameter: 1
        })
          .then(() => {
              this.matchingMesseage = "参加可能な部屋が見つかりました。"
              this.matchAlert = true
              
              localStorage.message = "クライアントとして部屋に参加しました！"
          })
          .catch((error) => {
            console.error("Error updating document: ", error);
          });
      }

      //host側の処理、自身が部屋を作成
      else {
        this.waitingKey = true
        //設定した部屋情報をfirestoreに渡す
        roomRef.add({
          // name: this.name,
          // thumbnailUrl: thumbnailUrl,
          createAt: firebase.firestore.Timestamp.now(),
          roomParameter: 1,
          // contents:this.contentsSelect,
          // time:this.timeSelect
        })
        //自身が作成した部屋のdoc.idを取得
        const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()
        roomIdRef.forEach(doc => {
          this.createdRoomId = doc.id
          
        })

        //一つ下の階層に、ルームステータスを設定(編集検知→参加、の処理フロー組み込む上で、領域分離が必要なため)
        roomRef.doc(this.createdRoomId).collection('roomstatus').add(
          {
            roomParameter: 0,
            createdAt: firebase.firestore.Timestamp.now()
          }
        )
        const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus')

        //change.type === "modified"であれば、部屋に合流
        ParameterRef.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
        
            if (change.type === "modified") {
                
                this.matchingMesseage = "新たな参加者を確認しました!"
                this.matchAlert = true
                localStorage.message = "ホストとして部屋に参加しました！"

                // this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } })
            }
         
          });
        })
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