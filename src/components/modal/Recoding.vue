<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <template v-slot:activator="{ on, attrs }">
      <v-btn class="mx-2" fab dark large color="cyan" v-bind="attrs" v-on="on">
        <v-icon dark>mdi-pencil</v-icon>
      </v-btn>
      {{ records }}
    </template>

    <v-card>
      <v-card-title>
        <span class="text-h5">作業内容の記録</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-menu v-model="dateMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" offset-y min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="date" label="作業日" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
              </template>
              <v-date-picker v-model="date" no-title scrollable :allowed-dates="allowedDates">
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="dateMenu = false">キャンセル</v-btn>
                <v-btn text color="primary" @click="dateMenu = false">OK</v-btn>
              </v-date-picker>
            </v-menu>

            <v-menu v-model="timeMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" offset-y max-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field v-model="time" label="作業時間" prepend-icon="mdi-clock-time-four-outline" readonly v-bind="attrs" v-on="on"></v-text-field>
              </template>
              <v-time-picker v-model="time" format="24hr"></v-time-picker>
            </v-menu>

            <v-textarea v-model="contents" label="作業内容" maxlength="20" rows="1"></v-textarea>
          </v-row>
        </v-container>
        作業内容を記録してください。
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="dialog = false">キャンセル</v-btn>
        <v-btn color="blue darken-1" text @click="onSubmit"  :disabled="!time || !contents || !date">保存する</v-btn>
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

    //自身のプロフィールドキュメントを参照
    firebase.firestore().collection("userlist").where("displayName", "==", auth.displayName).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.mydocid = doc.id
        })
      })
  },
  methods: {
    async onSubmit() {
      this.dialog = false
      //作業記録の追加
      const  userRef =firebase.firestore().collection('userlist').doc(this.mydocid)
      
      userRef.collection('records').add({ 
        createdAt: firebase.firestore.Timestamp.now(),        
        time: this.time,
        contents:this.contents,
        date: this.date,
      })
    },
    allowedDates(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 現在の日付の時間を00:00:00.000に設定
      const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0); // 選択された日付の時間を00:00:00.000に設定
      return selectedDate >= oneWeekAgo && selectedDate <= today;
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