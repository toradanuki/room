<template>
      <app>
        <v-row justify="center">

            <div class="text-center">
    <v-progress-circular
      v-if="waitingKey"
      indeterminate
      color="primary"
      
    ></v-progress-circular>
            </div>


    <v-dialog v-model="dialog" persistent max-width="600px">
        <template v-slot:activator="{ on, attrs }">

            <v-btn
      class="mx-2"
      fab
      dark
      large
      color="cyan"
      v-bind="attrs" v-on="on" 
    >
      <v-icon dark>
        mdi-pencil
      </v-icon>
    </v-btn>
    <v-card
  elevation="8"
  max-height="50px"
  shaped
  class="card"
  color="blue lighten-3"
  
><p class="p">作業仲間を見つける</p>
</v-card>

        </template>
        <v-card>
            <v-card-title>
                <span class="text-h5">作業部屋の作成</span>
            </v-card-title>
            <v-card-text>
                <v-container>
                    <v-row>

                        <v-col cols="12">
                            <v-text-field v-model="name" label="ルーム名" required></v-text-field>
                        </v-col>
                        <v-col cols="12">
                            <v-file-input v-model="file" runcate-length="15" accept="image/*" required label="お好みで部屋の
画像を設定して下さい。"></v-file-input>
                        </v-col>




                        <v-col
                cols="12"
                sm="6"
              >
                <v-select
                v-model="timeSelect"
                  :items="[30, 60, 120, 240]"
                 label="作業時間(分)"
                  required
                ></v-select>
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-autocomplete
                v-model="contentsSelect"

                  :items="['課題', '試験勉強', '資格取得', '仕事', 'その他', ]"
                  label="作業内容"
                  
                ></v-autocomplete>
              </v-col>


                    </v-row>
                </v-container>
                サムネイル画像を選択してください。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="dialog = false">
                    Close
                </v-btn>
                <v-btn color="blue darken-1" text @click="onSubmit">
                    マッチングを開始する
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</v-row>

    <v-dialog
      v-model="matchAlert"
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h5">
            {{ matchingMesseage }}
        </v-card-title>

        <v-card-text>
            部屋に参加します。
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="green darken-1"
            text
            @click="join"
          >
            はい
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</app>
    
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
    

            let thumbnailUrl = ""
            //作成した部屋のサムネイル画像のアップロード
            if (this.file) {
                const filePath = `/room/${this.file.name}`
                await firebase.storage().ref()

                    .child(filePath)
                    .put(this.file)
                    .then(async snapshot => {
                        thumbnailUrl = await snapshot.ref.getDownloadURL()
                        //プロフ画像変更と同じ要領でアップとリンク取得
                    })
            }

            const roomRef = firebase.firestore().collection('rooms')

            //待機中の部屋があれば、そのドキュメントidを取得

            await firebase.firestore().collectionGroup('roomstatus').where("roomParameter", "==", 0).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {

                    console.log("Document data:", doc.data());
                    this.hostServer = doc.id
                    console.log(this.hostServer);
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
                    console.log(this.joinRoomId, "joinRoomId called")

                })
                //参加する部屋のステータスを変更することで、部屋を閉ざしつつ相手にクライアントの参加をつたえる。

                            const roomParameterRef = roomRef.doc(this.joinRoomId).collection('roomstatus').doc(this.hostServer)
                            return roomParameterRef.update({
                                roomParameter: 1
                            })
                                .then(() => {
               
                                    this.matchingMesseage = "参加可能な部屋が見つかりました。"
                                    this.matchAlert = true

                                    console.log(this.matchAlert, "updated!");

                                    localStorage.message = "クライアントとして部屋に参加しました！"

                                })
                                .catch((error) => {
                                    console.error("Error updating document: ", error);
                                });


                //↑subCollectionRef.thenまでの処理
            }
 //host側の処理、自身が部屋を作成
            else {

                this.waitingKey = true
                
                //設定した部屋情報をfirestoreに渡す

                roomRef.add({
                    name: this.name,
                    thumbnailUrl: thumbnailUrl,
                    createAt: firebase.firestore.Timestamp.now(),

                    roomParameter: 1,
                    contents:this.contentsSelect,
                    time:this.timeSelect


                })
                //自身が作成した部屋のdoc.idを取得
                const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()
                roomIdRef.forEach(doc => {

                    this.createdRoomId = doc.id
                    console.log(this.createdRoomId, "createdRoomId called")
                })
                //一つ下の階層に、ルームステータスを設定(編集検知→参加、の処理フロー組み込む上で、領域分離が必要なため)

                roomRef.doc(this.createdRoomId).collection('roomstatus').add(
                    {
                        roomParameter: 0,
                        createdAt: firebase.firestore.Timestamp.now()
                    })




                const ParameterRef = firebase.firestore().collection('rooms').doc(this.createdRoomId).collection('roomstatus')

                //change.type === "modified"であれば、部屋に合流

                ParameterRef.onSnapshot((snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            console.log("NewRoom created ", change.doc.data());
                        }
                        if (change.type === "modified") {
                            console.log("someone joinedroom: ", change.doc.data());


                            this.matchingMesseage = "新たな参加者を確認しました!"
                            this.matchAlert = true
                            localStorage.message = "ホストとして部屋に参加しました！"

                            // this.$router.push({ path: '/chat', query: { room_id: this.createdRoomId } })

                        }
                        if (change.type === "removed") {
                            console.log("Removed city: ", change.doc.data());
                        }
                    });
                })

                //parameterref終了↑
            }

            //↑else文終了
            // })
            //↑promise.then終了
        }
        //↑onsubmit終了
    }
    //↑methos終了
}
//↑exportdef


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