<template>
  <v-app id="inspire">
    <div app >
      <v-toolbar-title :style="{ 'margin-top': '50px' }">ルーム一覧</v-toolbar-title>
      <v-btn v-if="returnLink" @click="returnRoom">復帰する</v-btn>
      <v-container >
        <v-row>
          <v-col v-for="room in rooms" :key="room.id" cols="12" sm="6" md="4">
            <v-btn elevation="2" class="roomName">{{ room.name }}</v-btn>
            <div v-for="participant in room.participants" :key="participant.name">
              {{ participant.name }}
            </div>
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
  </v-app>
</template>

<script>
import CreateRoom from '@/components/modal/CreateRoom.vue';
import Startmatching from '@/components/modal/Startmatching.vue';

import firebase from 'firebase'; 

export default {
  data: () => ({
    rooms: [],
    returnLink:""
  }),
  components: {
    CreateRoom,
    Startmatching,
    
  },
  mounted() {
    //保存したデータがあれば取得(state+"保存名"で取得,store参照)
    const returnRoomId = this.$store.state.roomId
    this.returnLink = returnRoomId

    this.getrooms()
    this.fetchAllRoomMembers()
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
    fetchAllRoomMembers() {
      const roomsRef = firebase.database().ref("rooms");
      roomsRef.on("value", (snapshot) => {
        this.participants = [];
        snapshot.forEach((roomSnapshot) => {
          const roomParticipantsRef = roomSnapshot.child("participants");
          roomParticipantsRef.forEach((childSnapshot) => {
            const participantStatus = childSnapshot.val();
            const participant = {
              room: roomSnapshot.key,
              name: childSnapshot.key,
              status: participantStatus,
              stayTime: childSnapshot.child('stayTime').val()
            };
            const room = this.rooms.find(room => room.id === participant.room);
            if (room) {
              if (!room.participants) {
                this.$set(room, 'participants', []);
              }
              // statusが1、または滞在時間のデータが存在する場合
              if (participantStatus === true || participant.stayTime) {
                // 同名の参加者が存在しない場合のみpush
                if (!room.participants.some(p => p.name === participant.name)) {
                  room.participants.push(participant);
                }
              } else {
                const index = room.participants.findIndex(p => p.name === participant.name);
                  if (index !== -1) {
                    room.participants.splice(index, 1);
                  }
              }
            } 
          });
        });
      });
    },
    returnRoom(){
      this.$router.push({ path: '/chat', query: { room_id: this.returnLink } });
    }
  },
}
</script>
