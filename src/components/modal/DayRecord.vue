<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn class="mx-2" fab dark large color="cyan" v-bind="attrs" v-on="on">
        日報
      </v-btn>
      {{ records }}
    </template>
    <v-card>
      <v-card-title>
        <span class="text-h5">日報</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-menu v-model="timeMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" offset-y max-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="time" label="今日の作業時間" prepend-icon="mdi-clock-time-four-outline" readonly v-bind="attrs" v-on="on"></v-text-field>
              </template>
              <v-time-picker v-model="time" format="24hr"></v-time-picker>
            </v-menu>
            <v-divider></v-divider>
            <v-textarea v-model="contents" label="今日の作業内容" maxlength="20" rows="1"></v-textarea>
          </v-row>
        </v-container>
        今日の活動内容を入力してください。
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="dialog = false">キャンセル</v-btn>
        <v-btn color="blue darken-1" text @click="onSubmit"  :disabled="!time || !contents || !date">送信する</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
  
  <script>
  import firebase from 'firebase';
  
  export default {
    data: () => ({
      dialog: false,
      dateMenu: "",
      timeMenu:"",
      date: "",
      time: "",
      contents:"",
      records:"",
    }),
  
    mounted() {
      //自身の情報を取得
      const auth = JSON.parse(localStorage.getItem('user'))
      const { displayName } = auth
      
      this.myuserid = auth.userId
      this.auth = auth
      this.names = displayName
  
      firebase.firestore().collection("partner").where("partner0", "==", auth.displayName).get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          this.mydocid = querySnapshot.docs[0].id;
        } else {
          firebase.firestore().collection("partner")
            .where("partner1", "==", auth.displayName)
            .get()
            .then((querySnapshot) => {
              if (!querySnapshot.empty) {
                this.mydocid = querySnapshot.docs[0].id;
              }
            });
        }
      });
    },
    methods: {
      async onSubmit() {
        this.dialog = false
        //作業記録の追加
        firebase.firestore().collection('partner').doc(this.mydocid).set({ 
          createdAt: firebase.firestore.Timestamp.now(),        
          contents:this.contents,
          date: this.date,
          goal:this.time
        }, { merge: true }) // フィールドが存在すれば更新、存在しなければ新規作成
      },
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