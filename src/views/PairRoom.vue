<template>
  <v-app>
    <SidebarSum />
    <v-main>  
      <!-- コンテナの幅をfluidに拡張 -->
      <v-container fluid>
        <v-row>
          <v-col>
            <v-card>
              <!-- スクロール割り当てのdiv -->
              <div class="chat-window">      
                <v-list two-line>
                  <template v-for="(data, index) in messages">
                    <!-- v-forの各要素は、vue.jsが一意に識別するためのkey属性が必須 -->
                    <!-- dividerはlistitem外なので、個別にkeyが必要 -->
                    <v-list-item :key="index">  
                      <v-btn icon>
                        <v-list-item-avatar>
                          <v-img :src="data.photoURL"></v-img>
                        </v-list-item-avatar>
                      </v-btn>
                      <v-list-item-content>
                        <v-row>
                          <v-col cols="11">
                            <div class="text-caption">{{ data.createdAt }}</div>
                            <v-list-item-subtitle class="message">{{ data.message }}</v-list-item-subtitle>
                          </v-col>
                          <v-col cols="1">
                            
                            <v-btn icon v-if="!(isMyMessage(data) && (data.heartStatus === 'grey' || data.heartStatus === false))" :class="{ 'heart-button': !(data.heartStatus === 'red' && isMyMessage(data)) }">
                              <v-icon :color="data.heartStatus === 'red' ? 'red' : 'grey'" @click="isMyMessage(data) ? null : toggleHeart(data)">mdi-heart</v-icon>
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-list-item-content>
                    </v-list-item>
                    <!-- 区切り線を表示 -->
                    <!-- dividerはlistitem外なので、未使用のkeyが必要 -->
                    <v-divider :key="`二つ目の${index}`"></v-divider>
                  </template>
                </v-list>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      <v-textarea v-model="body" append-icon="mdi-comment" class="mx-2" label="メッセージを送信する" rows="3" auto-grow></v-textarea>
      <v-btn class="mr-4" type="submit" :disabled="submitInvalid" @click="submit">送信する</v-btn>
      <v-btn @click="clear">削除する</v-btn>
    </v-main>
  </v-app>
</template>
  
<script>

  import SidebarSum from "@/components/layouts/SidebarSum.vue";
  import chatMixin from '@/mixins/mixin.js';

  export default {
    data: () => ({
      messages: [],
      auth: null,
      body: "",
      roomId: "",  
      heartStatus:false,    
    }),
    async mounted() {
      this.roomId = this.$route.query.room_id;
      this.auth = JSON.parse(localStorage.getItem('user'));
      this.observeMessagesAndGet();
    },
    components: { SidebarSum },
    mixins: [chatMixin],
  }
</script>
  
<style>
  .message {
    text-align: left;
  }
  .chat-window {
    height: 400px; 
    overflow-y: auto; 
  }
</style>