<template>
  <v-app id="inspire">
    <div app >
    
    <!-- :style="{ 'margin-bottom': '20px' }"> -->
    
    <!-- <v-app-bar app   >  -->
      <v-toolbar-title :style="{ 'margin-top': '50px' }">ルーム一覧</v-toolbar-title>
      
    
      <!-- <v-spacer></v-spacer> -->
      <!-- <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn> -->
    <!-- </v-app-bar>  -->
    <!-- <v-main>  -->
      <v-container >
        <v-row>
          <v-col v-for="room in rooms" :key="room.id" cols="12" sm="6" md="4">
            <v-btn elevation="2" class="roomName">{{ room.name }}</v-btn>
            <router-link :to="{ path: '/roomChat', query: { room_id: room.id } }">
              <v-avatar color="grey lighten-2" size="79">
                <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John" v-if="!room.thumbnailUrl">
                <img :src="room.thumbnailUrl" alt="John" v-if="room.thumbnailUrl">
              </v-avatar>
            </router-link>
          </v-col>
        </v-row>
      </v-container>
     <!-- </v-main>  -->
    <!-- <SidebarSum /> -->
   
  </div>
  <Startmatching />
    <CreateRoom /> 
    <MenuBar :style="{ 'margin-bottom': '50px' }" />

  </v-app>

</template>
  
<script>
// import SidebarSum from '@/components/layouts/SidebarSum.vue';
import CreateRoom from '@/components/modal/CreateRoom.vue';
import Startmatching from '@/components/modal/Startmatching.vue';
import MenuBar from '@/components/layouts/MenuBar.vue';
import firebase from 'firebase'; // Add this import statement

export default {
  data: () => ({
    rooms: []
  }),

  name: 'HomeView',
  components: {
    
    CreateRoom,
    Startmatching,
    MenuBar
  },
  methods: {
    getrooms() {
  // ルームチャットに該当するルーム情報のみ取得(Parameter=0)
  this.rooms = []
  const roomRef = firebase.firestore().collection("rooms").where("roomParameter", "==", 0)
  // .orderBy("createAt", "asc")

  // onSnapshotを使用して、データベースの変更をリアルタイムで検知
  roomRef.onSnapshot(snapshot => {
    this.rooms = [] // roomsを初期化
    snapshot.forEach(doc => {
      const data = {...doc.data()}
      data.id = doc.id
      this.rooms.push(data)
    })
  })
}
  },
  mounted() {
    // console.log("検証",this.$store.state.user,this.$store.state.user.displayName)
    this.getrooms()

    
  },
}
</script>

<style>
/* .roomName {
  text-align: left;
  bottom: 10px;
} */
</style>