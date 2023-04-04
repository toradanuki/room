<template>
    <v-app id="inspire">
      <SidebarSum />
      <v-app-bar app shrink-on-scroll>
        <v-toolbar-title>ルームー一覧</v-toolbar-title>
        <Startmatching />
        <CreateRoom />
        <v-spacer></v-spacer>
        <v-btn icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </v-app-bar>
      <v-main>
        <v-container>
          <v-row>
            <v-col v-for="room in rooms" :key="room.id" cols="4">
                <!-- データ全取得からの振り分け、間が空いてしまう・・・ -->
                <!-- <v-div   v-if="room.roomParameter ?  false:true"> -->

              <v-btn elevation="2" class="roomName">{{ room.name }}</v-btn>
                <!--取得した"doc.data"に追加したroom.idをクエリパラメータとして付加  -->
              <router-link :to="{ path: '/chat', query: { room_id: room.id } }">
                <v-avatar color="grey lighten-2" size="79">
                  <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John" v-if="!room.thumbnailUrl">
                  <img :src="room.thumbnailUrl" alt="John" v-if="room.thumbnailUrl">
                </v-avatar>
              </router-link>

            <!-- </v-div> -->


            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
<script>
import SidebarSum from '@/components/layouts/SidebarSum.vue';
 import CreateRoom from '@/components/modal/CreateRoom.vue';
import Startmatching from '@/components/modal/Startmatching.vue';

import firebase from 'firebase';






export default {
    data: () => ({
        rooms: []
    }),

    name: 'HomeView',
    components: {
        SidebarSum,
        CreateRoom,
        
        Startmatching
    },
    methods: {
        async getrooms() {
            console.log("aa")

            //ルームチャットに該当するルーム情報のみ取得(Parameter=0)


            this.rooms = []
            const roomRef = firebase.firestore().collection("rooms").where("roomParameter", "==", 0)
            const snapshot = await roomRef.get()
            //恐らくこのルーム情報取得の記述二文に分けてるのは定型、仕様の模様(awaitやpromise不可欠)
            console.log(snapshot)
            snapshot.forEach(doc => {

                
                const data = {...doc.data()}
                 //スプレッド構文。オブジェクトを簡潔な記述でdataに格納。本来は上記コメントアウトの記述
                data.id = doc.id
                // この一文でdataオブジェクトに、keyがIDのdoc.dataオブジェクト格納出来る
            
                this.rooms.push(data)
          
                //push配列への組み込みメソッド。な
            })




        }

    },
    mounted() {
       
        this.getrooms()
    },


}
</script>

<style>
.roomName {
  text-align: left;
  bottom: 10px;
  
}
</style>