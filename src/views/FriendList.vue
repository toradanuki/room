<template>
  <v-app>
    <SidebarSum />



    <!-- 申請者リストコンテナ(カード) -->
    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col v-for="(card) in cards" :key="card" cols="12" >
          <v-card class="a" >
            <v-subheader>{{ card }}</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in messages">
                <v-list-item :key="index" v-if="data.status == 'off'" >
                  <!-- ここからmenu実装 -->
                 <v-menus v-model="menuIndex">  
                    <v-menu bottom min-width="200px" rounded offset-y>
                      
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                          <v-list-item-avatar color="grey darken-1">
                            <v-img :src="data.photoURL"></v-img>
                          </v-list-item-avatar>
                        </v-btn>
                      </template>


                      <v-card>
                        <v-list-item-content class="justify-center">
                          <div class="mx-auto text-center">
                            <v-avatar color="brown">
                              <v-img :src="data.photoURL"></v-img>
                            </v-avatar>
                            <h3>{{ data.name }}</h3>
                            <p class="text-caption mt-1">
                              
                            </p>
                            
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text @click="toProfile">"*未 プロフィールを参照する"</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{ data.post }}</v-btn>


                          </div>
                        </v-list-item-content>
                      </v-card>


                    </v-menu>
              </v-menus>  

              <v-btn @click="agree(data)" v-model=data.id  >同意する</v-btn>

<v-btn @click="cancel(data)">拒否する</v-btn>


                </v-list-item>
                <!-- <v-divider v-if="n !== 6" :key="`divider-${index}`" inset></v-divider> -->
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <!-- これよりフレンドリストコンテナ -->

    <v-container class="py-8 px-6" fluid>
      <v-row>
        <v-col v-for="(card) in cards" :key="card" cols="12" >
          <v-card class="a" >
            <v-subheader>フレンド一覧</v-subheader>

            <v-list two-line>
              <template v-for="(data, index) in friends">
                <v-list-item :key="index"  >
                  <!-- ここからmenu実装 -->
                 <v-menus v-model="menuIndex">  
                    <v-menu bottom min-width="300px" rounded offset-y>
                      
                      <template v-slot:activator="{ on }">
                        <v-btn icon x-large v-on="on">
                          <v-list-item-avatar color="grey darken-1">
                            <v-img :src="data.photoURL"></v-img>
                          </v-list-item-avatar>
                        </v-btn>
                      </template>


                      <v-card>
                        <v-list-item-content class="justify-center">
                          <div class="mx-auto text-center">
                            <v-avatar color="brown">
                              <v-img :src="data.photoURL"></v-img>
                            </v-avatar>
                            <h3>{{ data.name }}</h3>
                            <p class="text-caption mt-1">
                              <!-- {{ user.email }} -->
                            </p>
                            
                            <v-divider class="my-3"></v-divider>
                            <!-- <router-link :to="{ path: '/profile', query: { u_id: data.friendId } }">  -->
                            <v-btn depressed rounded text @click="toPairRoom(data.name)">個人チャットを始める</v-btn>
                          <!-- </router-link> -->
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"*未 プロフィールを参照する"}}</v-btn>
                            <v-divider class="my-3"></v-divider>
                            <v-btn depressed rounded text>{{"閉じる" }}</v-btn>


                          </div>
                        </v-list-item-content>
                      </v-card>


                    </v-menu>
              </v-menus>  
              <!-- <v-btn @click="apply(data)" v-model=data.id >削除する</v-btn> -->
              </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
      
      
      
      <script>
      
      // import firebase from "@/firebase/firebase"
       import SidebarSum from '@/components/layouts/SidebarSum.vue';
        import firebase from "@/firebase/firebase"

      
      
      
      export default {
  
        data: () => ({
       
        messages: [],
        cards:["受信一覧"],

        friends:[],
    

    dialog:false,
    menuIndex:"",
   
   chip4: true,
   btn:false,
   logstack:"",
   value:"false",
   userDocId:"",
   roomTime:"",
   auth:null,
   body: "",
   room:null,
   roomId: "",
   applyName:"",
   myuserid:"",
   mydocId: "",
   mydocid:"",
   parterDocId:"",
   ownData:"",
   applicantDocId:"",
   createdRoomId:"",
   pairRoomId:"",
 
   drawer: null,
   joinmessage:"",



      }),
        
         components: { SidebarSum },


  mounted(){

   

//解読してく。まず自身の申請者リストみるためドキュメント開く。

const auth= JSON.parse(sessionStorage.getItem('user'))

const{displayname}=auth

console.log(displayname)

this.myuserid = auth.userId

this.auth = auth




//セッションストレージに格納していた自分のdispnameから、自身のプロフ格納ドキュメント元idを参照
firebase.firestore().collection("userlist").where("displayname", "==",auth.displayname)
.get()
.then((querySnapshot) => {
querySnapshot.forEach((doc) => {


this.mydocid = doc.id

//プロフを取得して、申請者のid,senderidを取得する


//ここから改修




firebase.firestore().collection("userlist").doc(this.mydocid).collection('applicant').orderBy('createdAt','asc')
.onSnapshot(snapshot =>{
snapshot.docChanges().forEach(change => {
console.log('new applicant' , change.doc.data())

this.messages.push(change.doc.data())

console.log(this.messages.stat)



})
} );


//ここから最後の実装？フレンドリストデータ受信

 firebase.firestore().collection("userlist").doc(this.mydocid).collection('friend')
//  .orderBy('createdAt','asc')
 .onSnapshot(snapshot =>{
 snapshot.docChanges().forEach(change => {
 console.log('new friends' , change.doc.data())

 this.friends.push(change.doc.data())

 })})

});
})

},

        methods:{
          async toPairRoom(pairName){

            await firebase.firestore().collectionGroup('friend').where("name", "==",pairName).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {

                  const data =doc.data()

                    console.log("Document data:", doc.data());
                    this.pairRoomId = data.pairRoomId
                   
                })
            })
            console.log(this.pairRoomId );



            //これ、this.createdRoomIdいけん理由、vueにはデータ保持機能がないから。。。Nuxt.jsなら態々firestoreから呼び出さんでも済むんか。。
            //今後要検討かな...負担的にも

            //相手のpairroomidを取得する必要
            //friends引数で、相手のu.id取得→自分のフレンドリストから、u.id一致するコレクション参照→pairroom取得



          this.$router.push({ path: '/chat', query: { room_id:this.pairRoomId} })
            
          
 
          },

          async agree(friendInfo){

            this.value =true

            const  userListRef =firebase.firestore().collection("userlist")


             //自分宛てへのフレンド申請者情報が格納されたdoc.idを取得(ToMeapplicantDoc.id)

            await firebase.firestore().collectionGroup('applicant').where("name", "==",friendInfo.name).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {

                    console.log("Document data:", doc.data());
                    this.applicantDocId = doc.id
                   
                })
            })

            //申請者のステータスを変更し、受信一覧への描画を停止させる


            userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
                                status: "on"
                            })
                                .then(() => {
                                    console.log("Document successfully updated!");

                                })
                                .catch((error) => {
                                    console.error("Error updating document: ", error);
                                });


            //**オブジェクトも引数としてとれる。そして異なるコンテキスト内でも各要素それぞれドット記法で呼び出せた**

            console.log(friendInfo,"info called",this.mydocid)


            //ここから改修、合意後ルーム生成処理


             //ペアルーム向けに設定した部屋情報をfirestoreに渡す

             const roomRef = firebase.firestore().collection('rooms')


             await roomRef.add({
                    // name: this.auth.name+friendInfo.name,
                    // thumbnailUrl: thumbnailUrl,
                    createAt: firebase.firestore.Timestamp.now(),

                    roomParameter: 1,
                    // contents:this.contentsSelect,
                    // time:this.timeSelect


                })
                //作成したペアルームのdoc.idを取得
                const roomIdRef = await roomRef.orderBy("createAt", "desc").limit(1).get()
                roomIdRef.forEach(doc => {

                    this.createdRoomId = doc.id
                    console.log(this.createdRoomId, "createdRoomId called")
                })












             //承諾した相手のユーザー情報、ルーム情報をフレンドリストに格納

          
      userListRef.doc(this.mydocid).collection('friend').add(
       
         {  friendId:friendInfo.candidate,
          name: friendInfo.name,
         photoURL: friendInfo.photoURL,
        pairRoomId:this.createdRoomId  } 

         )

        

         await userListRef.where("displayname", "==",friendInfo.name)
.get()
.then((querySnapshot) => {
querySnapshot.forEach((doc) => {


this.parterDocId = doc.id


})})

//相手のdocidを取得

console.log(this.auth)

//相手側もフレンドリスト情報更新

userListRef.doc(this.parterDocId).collection('friend').add(
       
       {  friendId:this.auth.uid,
        name: this.auth.displayname,
       photoURL: this.auth.photoURL,
       pairRoomId:this.createdRoomId   } 

       )

        },


         async cancel(friendInfo){

          //受信一覧からの表示をなくすだけの表示。

          const  userListRef =firebase.firestore().collection("userlist")

          

           await firebase.firestore().collectionGroup('applicant').where("name", "==",friendInfo.name).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {

                    console.log("Document data:", doc.data());
                    this.applicantDocId = doc.id
                   
                })
            })


            await userListRef.doc(this.mydocid).collection("applicant").doc(this.applicantDocId).update({
                                status: "on"
                            })
                                .then(() => {
                                    console.log("Document successfully updated!");

                                })
                                .catch((error) => {
                                    console.error("Error updating document: ", error);
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
  .a{
    margin: auto;
    padding: auto;
    width: 300px;
    
  }
  </style>