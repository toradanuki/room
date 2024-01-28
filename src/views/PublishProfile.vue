<template>
  <v-app>
    <v-container>
      <v-row align="center">
        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-img :src="friendData.photoURL" aspect-ratio="1"></v-img>
            <v-card-title>{{ friendData.displayName }}</v-card-title>
            <v-card-subtitle>年齢: {{ friendData.age }}</v-card-subtitle>
            <v-card-text>職業: {{ friendData.post }}</v-card-text>
            <v-card-text>プロフィール: {{ friendData.profile }}</v-card-text>
            <v-card-text>目的: {{ friendData.purpose }}</v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="partnerDocId">
          <v-simple-table>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">項目</th>
                  <th class="text-left">内容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>今日の目標作業時間</td>
                  <td>{{partnerContents.goal}}</td>
                </tr>
                <tr>
                  <td>共有の目標</td>
                  <td>{{partnerContents.contents}}</td>
                </tr>
                <tr>
                  <td>目標達成期日</td>
                  <td>{{partnerContents.date}}</td>
                </tr>
                <tr>
                  <td>最終編集日</td>
                  <td>{{partnerContents.createdAt}}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <div class="d-flex align-center">
            <Startmatching :targetPartnerId="targetPartnerId" v-if="partnerDocId" />
            <PartnerStatus v-if="partnerDocId" />
            <div class="center-button" v-if="partnerDocId">
              <v-dialog v-model="dialog" persistent max-width="600px">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn class="mx-2" fab dark large :color="reportValid === false ? 'grey' : 'cyan'" v-bind="attrs" v-on="on">
                    <p v-if="reportValid === false">済</p>
                    <p v-else-if="reportValid === true">日報</p>
                  </v-btn>
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
                      </v-row>
                      <v-divider></v-divider>
                      <v-row>
                        <v-textarea v-model="body" label="今日の作業内容" maxlength="20" rows="4"></v-textarea>
                      </v-row>
                    </v-container>
                    今日の活動内容を入力してください。
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="dialog = false">キャンセル</v-btn>
                    <v-btn color="blue darken-1" text @click="submitDayRecord" :disabled="!time || !body">送信する</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
    <Record v-if="friendData" :friendData="friendData"/>
  </v-app>
</template>
  
<script>

import Startmatching from '@/components/modal/Startmatching.vue';
import firebase from 'firebase';
import Record from './Record.vue';
import PartnerStatus from '@/components/modal/PartnerStatus.vue';
// import DayRecord from '@/components/modal/DayRecord.vue';


export default {
  components: { 
    Record,PartnerStatus,Startmatching,
  },
  data: () => ({
    friendId:"",
    recordsData:[],
    friendData:[],
    timeMenu:"",
    dialog:"",
    reportValid:true,
    targetPartnerId:true,
    studyGoal: "",
    sharedGoal: "",
    pairRoomId:"",
    body:"",
    time:"",
    partnerContents:"",
    sharedResult: "",
    upcomingEventDate: "",
    user:"",
    partnerDocId:"",
  }),
  async created() {
    this.targetPartnerId = this.$route.query.user_id;
    this.user = JSON.parse(localStorage.getItem('user'));
    this.partnerDocId = await this.getPartnerDoc()

    this.getPartnerContents();
    this.getPairRoomDocId(this.targetPartnerId);
  },
  async mounted() {

    // ローカルストレージから時間を取り出し、日付を確認
    const storedTime = new Date(localStorage.getItem('time'));
    const storedDate = storedTime.getDate();
    const currentDate = new Date().getDate();

    if (storedDate === currentDate) {
      this.reportValid = false
    }
    this.getFriendAndRecords();
  },
  
  methods: {
    async submitDayRecord(){
      this.dialog = false
      this.reportValid = false

      // 現在の時間を取得し、セッションストレージに格納
      const now = new Date();
      localStorage.setItem('time', now);
      // フレンド部屋のdocidを取得する
      let [hours, minutes] = this.time.split(':');
      let formattedTime = `${hours}時間${minutes}分`;

      const roomRef = firebase.firestore().collection('rooms').doc(this.pairRoomId);
      roomRef.collection('messages').add({
        message: `${formattedTime}\n${this.body}`,
        name: this.user.displayName,
        photoURL: this.user.photoURL,
        createdAt: firebase.firestore.Timestamp.now(),
        userId: this.user.uid,
        heartStatus: false,
        todayReport:true
      });
    },
    async getPairRoomDocId(targetPartnerId) {
      await firebase.firestore().collectionGroup('friend').where("friendId", "==", targetPartnerId).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data();     
            this.pairRoomId = data.pairRoomId;
          });
        });
    },

    getPartnerContents(){
      firebase.firestore().collection('partner').doc(this.partnerDocId)
        .onSnapshot((doc) => {
          if (doc.exists) {
          const data = doc.data();
            if (data.createdAt) {
              const date = data.createdAt.toDate(); // タイムスタンプをDateオブジェクトに変換
              const year = date.getFullYear();
              const month = ("00" + (date.getMonth() + 1)).slice(-2); // 月を2桁にフォーマット
              const day = ("00" + date.getDate()).slice(-2); // 日を2桁にフォーマット
              data.createdAt = `${year}-${month}-${day}`; // YYYY/MM/DD形式に変換
            }
          this.partnerContents = data; // ドキュメントのデータを取得
          }
        })
    },
    async getPartnerDoc() {
      const db = firebase.firestore();
      const partnerRef = db.collection('partner');
      try {
        const snapshot = await partnerRef.where('partner0', '==', this.user.displayName).get();
        if (!snapshot.empty) {
          return snapshot.docs[0].id
        }
        const snapshot2 = await partnerRef.where('partner1', '==', this.user.displayName).get();
        if (snapshot2 && !snapshot2.empty) {
          return snapshot2.docs[0].id;
        }
      } catch (error) {
        console.error('Error getting document: ', error);
      }
    },
    // フレンドのプロフィール情報と作業記録を取得
    async getFriendAndRecords() {
      const friendId = this.$route.query.user_id;
      const userCollection = firebase.firestore().collection("userlist");
      // フレンドの情報を取得
      const friendSnapshot = await userCollection.where("userId", "==", friendId).get();
      let friendDocId = null;

      friendSnapshot.forEach((doc) => {
        this.friendData = doc.data(); 
        friendDocId = doc.id; 
      });

      // サブコレクションの情報を取得
      const recordsCollection = userCollection.doc(friendDocId).collection('records');
      const recordsSnapshot = await recordsCollection.get();
      recordsSnapshot.forEach((doc) => {
        this.recordsData.push(doc.data()); 
      });
    }
  },
}
</script>
  
<style>
  .card {
    margin: auto;
    padding: auto;
  }
  /* テーブルのセルのテキストを左詰めにする */
  .v-data-table td {
    text-align: left;
  }
  .center-button {
  display: flex;
  justify-content: center;
}
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>