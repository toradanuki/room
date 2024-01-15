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
    </v-container>
  </v-app>
</template>
  
  <script>
  // import firebase from "@/firebase/firebase"
  import SidebarSum from '@/components/layouts/SidebarSum.vue';
  import firebase from 'firebase';
  
  export default {

    components: { SidebarSum },

    data: () => ({
      friendId:"",
      recordsData:[],
      friendData:[]
     
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
    console.log("フレンドデータ",this.friendData)
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
  </style>