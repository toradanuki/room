<template>
  <v-card>
    <v-toolbar flat>
      <!-- メニュー展開 -->

   
      <v-app-bar-nav-icon v-on="on"></v-app-bar-nav-icon>
    
      <!-- メニュー終わり、slot介して挟み込みで実装 -->
      <v-toolbar-title>Contact Database</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

      <template v-slot:extension>
        <v-tabs
          v-model="tabs"
          fixed-tabs
        >
          <v-tabs-slider></v-tabs-slider>
          <v-tab
            href="#mobile-tabs-5-1"
            class="primary--text"
          >
          <div style="display: flex; flex-direction: column; align-items: center;">
    <span>Recents</span>
    <v-icon>mdi-phone</v-icon>
  </div>
</v-tab>
          <v-tab
            href="/Profile"
            class="primary--text"
          >
            <v-icon>mdi-heart</v-icon>
          </v-tab>

          <v-tab
            href="#mobile-tabs-5-3"
            class="primary--text"
          >
            <v-icon>mdi-account-box</v-icon>
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      menuItems: [
        { title: 'Menu Item 1' },
        { title: 'Menu Item 2' },
        { title: 'Menu Item 3' },
        // 他のメニューアイテム...
      ],
    };
  },
  // 他のオプション...
};
</script>