<template>
  <v-app>
    <SidebarSum />

    <v-container>
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-img :src="friendData.photoURL" aspect-ratio="1"></v-img>
            <v-card-title>{{ friendData.displayname }}</v-card-title>
            <v-card-subtitle>年齢: {{ friendData.age }}</v-card-subtitle>
            <v-card-text>職業: {{ friendData.post }}</v-card-text>
            <v-card-text>プロフィール: {{ friendData.profile }}</v-card-text>
            <v-card-text>目的: {{ friendData.purpose }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>


       <!-- 新たに追加した表 -->
       <v-row>
        <v-col cols="12" sm="6" md="4">
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
                  <td>今週の勉強時間目標</td>
                  <td></td>
                </tr>
                <tr>
                  <td>共有の目標</td>
                  <td></td>
                </tr>
                <tr>
                  <td>結果を共有する</td>
                  <td></td>
                </tr>
                <tr>
                  <td>直近のイベント日</td>
                  <td></td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-col>
      </v-row>

    </v-container>
    <!-- Recordコンポーネントに輸出するデータをバインド -->
    <Record v-if="friendData" :friendData="friendData"/>
  </v-app>
</template>
  
<script>
import SidebarSum from '@/components/layouts/SidebarSum.vue';
import firebase from 'firebase';
import Record from './Record.vue';


export default {
  components: { 
    SidebarSum ,Record
  },
  data: () => ({
    friendId:"",
    recordsData:[],
    friendData:[],

    studyGoal: "",
    sharedGoal: "",
    sharedResult: "",
    upcomingEventDate: ""



  }),

  async mounted() {
    this.friendId = this.$route.query.user_id
    this.getFriendAndRecords();
  },
  
  methods: {

    // フレンドのプロフィール情報と作業記録を取得
    async getFriendAndRecords() {
      const friendId = this.$route.query.user_id;

      const userCollection = firebase.firestore().collection("userlist");

      // フレンドの情報を取得
      const friendSnapshot = await userCollection.where("userId", "==", friendId).get();

      // let friendData = null;
      let friendDocId = null;

      friendSnapshot.forEach((doc) => {
        this.friendData = doc.data(); // フレンドのデータ
        friendDocId = doc.id; // フレンドのドキュメントID
        
      });

      // サブコレクションの情報を取得
      const recordsCollection = userCollection.doc(friendDocId).collection('records');
      const recordsSnapshot = await recordsCollection.get();
      // let recordsData = [];

      recordsSnapshot.forEach((doc) => {
        this.recordsData.push(doc.data()); // レコードのデータ
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
</style>