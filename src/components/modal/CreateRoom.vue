
<template>
  <!-- <v-row justify="center"> -->
    <v-dialog v-model="dialog" persistent max-width="600px" >
      <template v-slot:activator="{ on, attrs }">
        <v-row justify="center">
  <v-col cols="auto" class="text-center">
    <v-btn color="primary" dark v-bind="attrs" v-on="on" class="bt">
      部屋を作成する
    </v-btn>
  </v-col>
</v-row>
      </template>
      <v-card>
        <v-card-title>
          <span class="text-h5">新たな部屋を作成する</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="name" label="ルーム名" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-file-input v-model="file" truncate-length="15" accept="image/*"></v-file-input>
              </v-col>
            </v-row>
          </v-container>
          <small></small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialog = false">
            閉じる
          </v-btn>
          <v-btn color="blue darken-1" text @click="onSubmit">
            作成
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  <!-- </v-row> -->
</template>
  
<script>
import firebase from 'firebase';

export default {
  data: () => ({
    dialog: false,
    name: "",
    file: null
  }),
  methods: {
    async onSubmit() {
      this.dialog = false

      let thumbnailUrl = ""
      if (this.file) {
        const filePath = `/room/${this.file.name}`
        await firebase.storage().ref()
          .child(filePath)
          .put(this.file)
          .then(async snapshot => {
            thumbnailUrl = await snapshot.ref.getDownloadURL()
          })
      }

      const roomRef = firebase.firestore().collection('rooms')
      roomRef.add({
        name: this.name,
        thumbnailUrl: thumbnailUrl,
        createAt: firebase.firestore.Timestamp.now(),
        roomParameter: 0
      })
    }
  } 
}
</script>
  
<style scoped>
</style>

