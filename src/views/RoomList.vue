<template>
  <v-app id="inspire">
    <div app >
      <v-toolbar-title :style="{ 'margin-top': '50px' }">ルーム一覧</v-toolbar-title>
      <v-btn v-if="returnLink" @click="returnRoom">復帰する</v-btn>
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
    </div>
    <Startmatching />
    <CreateRoom /> 
    <MenuBar :style="{ 'margin-bottom': '50px' }" />
  </v-app>
</template>
  
<script>
import CreateRoom from '@/components/modal/CreateRoom.vue';
import Startmatching from '@/components/modal/Startmatching.vue';
import MenuBar from '@/components/layouts/MenuBar.vue';
import firebase from 'firebase'; 

export default {
  data: () => ({
    rooms: [],
    returnLink:""
  }),
  components: {
    CreateRoom,
    Startmatching,
    MenuBar
  },
  mounted() {
    //保存したデータがあれば取得(state+"保存名"で取得,store参照)
    const returnRoomId = this.$store.state.roomId
    this.returnLink = returnRoomId

    this.getrooms()
  },
  methods: {
    getrooms() {
      this.rooms = []
      // クエリ(where)+並び替えの時には、Firebaseで専用のインデックスの作成が必要
      // 加えて、クエリ＋サブコレクション全体検索のとき
      const roomRef = firebase.firestore().collection("rooms").where("roomParameter", "==", 0).orderBy("createAt", "asc")
      // onSnapshotを使用して、データベースの変更をリアルタイムで検知
      roomRef.onSnapshot(snapshot => {
        this.rooms = [] 
        snapshot.forEach(doc => {
          const data = {...doc.data()}
          data.id = doc.id
          this.rooms.push(data)
        })
      })
    },
    returnRoom(){
      this.$router.push({ path: '/chat', query: { room_id: this.returnLink } });
    }
  },
  
}
</script>
