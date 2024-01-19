<template>
  <v-app>
    <SidebarSum class="sidebar"/>
    <div class="content">
      <v-btn @click="changeWeek(-1)">先週</v-btn>
      <v-btn @click="changeWeek(1)">翌週</v-btn>
      <Recoding />
      <p>今週の作業時間:{{ weekRecordsTime }} </p>
      <Bar updateChartData id="my-chart-id" :options="chartOptions" :data="chartData" />
      <v-menu v-model="dateMenu" :close-on-content-click="false" :close-on-click="false" :nudge-right="40" transition="scale-transition" offset-y min-width="290px">
        <template v-slot:activator="{ on, attrs }">
          <v-text-field v-model="date" :label="today" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
        </template>
        <!-- @inputで日付の選択があれば直ちにデータに反映する --> 
        <v-date-picker v-model="date" no-title scrollable @input="handleClick" color="deep-purple darken-4" >
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="dateMenu = false">キャンセル</v-btn>
        </v-date-picker>
      </v-menu>
      <div class="pie-chart-container">
        <Pie :data="pieChartData" />
      </div>
    </div>
  </v-app>
</template>
  
<script>
import 'chart.js';
import firebase from "@/firebase/firebase"
import { Bar,Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale,ArcElement, DoughnutController } from 'chart.js'
import Recoding from '@/components/modal/Recoding.vue';
import SidebarSum from '@/components/layouts/SidebarSum.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement, DoughnutController)

export default {
  name: 'BarChart',
  components: { Bar,Recoding,SidebarSum,Pie },
  data() {
    return {
      records:[],
      weekRecordsTime:null,
      date:"",
      dateMenu:"",
      today:"",
      thisWeekRecords:[],
      weekOffset: 0,
      selectedDate: null, // 選択された日付を保存するためのデータプロパティ
      pieChartData: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#ADFF2F', '#FFD700',
            '#FF4500', '#9ACD32', '#6A5ACD', '#20B2AA', '#00FFFF'
          ],
          hoverBackgroundColor: [
            '#FFB6C1', '#87CEFA', '#FFFFE0', '#CAFF70', '#FFEC8B',
            '#FF6347', '#98FB98', '#836FFF', '#7FFFD4', '#E0FFFF'
          ]
        }]
      },
      chartData: {
        labels: [],
        datasets: [ { data: [0,0,0,0,0,0,0] } ]
      },
      options: {
        title: {
          display: true,
          text: 'My Chart Title'
        }
      },
      chartOptions: {
        responsive: true,
        scales: {
          y: {
            min: 0, // 最小値を0に設定
            max: 24 * 60, // 最大値を24時間（1440分）に設定
            ticks: {
              stepSize: 180, // ここに目盛りの間隔を設定
              // 目盛りを時間として表示するカスタムフォーマッター
              callback: function(value, ) {
                return Math.floor(value / 60) + '時間'; // 60で割って時間に変換し、小数点以下を切り捨て
              }
            }
          }
        }
      }
    }
  },
  created() {
  // コンポーネントが作成された後、chartDataのlabelsを初期化
    this.chartData.labels = this.getWeekDates(); 
    const todayDate = new Date();
    this.today = `日付を選択:${todayDate.getFullYear()}-${todayDate.getMonth()+1}-${todayDate.getDate()}`;
  },

    mounted() {
    //自身の情報を取得
    const auth = JSON.parse(sessionStorage.getItem('user'))
    const { displayname } = auth
    this.myuserid = auth.userId
    this.auth = auth
    this.names = displayname

    this.updateMyRecord();
  },

  methods: {
    updateMyRecord(){
      //自身のプロフィールドキュメントを参照
    firebase.firestore().collection("userlist").where("displayname", "==", this.auth.displayname).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          this.mydocid = doc.id
        })
        //作業記録の取得と更新
        firebase.firestore().collection("userlist").doc(this.mydocid).collection('records').orderBy('createdAt', 'asc')
          .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
              this.records.push(change.doc.data())
            })
            this.aggregateData();
          });
      })  
    },

    getWeekDates() {
      const weekDates = [];
      // ローカルな日時を取得
      const date = new Date();
      date.setDate(date.getDate() + this.weekOffset * 7);
      
      // 指定された日時の曜日を取得（月曜日から0のインデックス)
      const day = date.getDay();
      // 月の日付(getDate) -  修正分
      // 今日に対する、月曜日の日付を取得
      const diff = date.getDate() - day + (day == 0 ? -6 : 1); 
      // 月曜日の日付をもつ新しいDateオブジェクトの生成
      // setDate(日付のインデックス)で与えられた月の"日"を設定、よって今週の月曜日の月日を取得
      const MondayOfThisWeek = new Date(date.setDate(diff));
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      for (let i = 0; i < 7; i++) {
        // 名称の変換のみ
        const newDate = new Date(MondayOfThisWeek);
        // 月~日までの日付を取得
        newDate.setDate(MondayOfThisWeek.getDate() + i);
        // MM/DD/(Day)の表記を作成
        weekDates.push(`${newDate.getMonth() + 1}/${newDate.getDate()}(${days[newDate.getDay()]})`);
      }
      return weekDates;
    },

    changeWeek(offset) {
      this.weekRecordsTime=0
      this.weekOffset += offset;
      this.chartData = {
      ...this.chartData,
      labels: this.getWeekDates()
      };
      this.aggregateData();
    },
    handleClick() {
      this.dateMenu = false;
      this.referenceTodaydata(this.date);
    },
    convertTimeToMinutes(timeString) {
      let parts = timeString.split(":");
      let hours = parseInt(parts[0], 10);
      let minutes = parseInt(parts[1], 10);
      return hours * 60 + minutes;
    },
    referenceTodaydata(pickDate) {
      // ------------ 円グラフの作成 ------------

      // 今日の日付を取得→選択した日付を取得、今日にする
      const today = new Date(pickDate || new Date())
      // 今日の時刻データを0にする(時間/分/秒/ミリ秒)
      today.setHours(0, 0, 0, 0);

      //filter ,配列メソッドの一つ。配列の各要素に対して処理を行い、新たな配列を生成する。
      //filter( 要素  =>  {テスト関数}),要素(任意命名)がテスト関数を満たした場合、値が返される。

      //  取り出したデータが今日以上 & 明日未満、今日の日付に該当する場合のみ配列に格納
      const todayRecords = this.records.filter(record => {
        // 不適なYYYY/MM/DD形式の日付データを、Date関数で適切な新しいDateオブジェクトを生成
        // new Date(value),valueは日付文字列、エポックタイム(基準からのミリ秒数)、全単位の数字(2000-0-0-0-0-0-0)に対応

        // Dateオブジェクトを文字列に変換すると、お馴染みのMON Jan 15 2024 00:00:00 タイムゾーンとなる、コンソール形式

        const recordDate = new Date(record.date);
        // 明日の日付オブジェクトを取得
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        // 全て日付オブジェクトに変換できたので、評価可能に
        return recordDate >= today && recordDate < tomorrow;
      });

      // 内容ごとに作業時間を集計
      const todayAggregatedData = {};
      todayRecords.forEach(record => {
        // 分換算に変更
        let parts = record.time.split(":");
        let hours = parseInt(parts[0], 10);
        let minutes = parseInt(parts[1], 10);
        let time = hours * 60 + minutes;
        if (!todayAggregatedData[record.contents]) {
          todayAggregatedData[record.contents] = 0;
        }
        // 項目の勉強時間内訳 = 加算済み勉強時間 + 取り出した勉強時間
        todayAggregatedData[record.contents] += time;
      });

      // 集計したデータをもとに円グラフのデータを作成
      this.pieChartData = {
        labels: Object.keys(todayAggregatedData),
        datasets: [{
          data: Object.values(todayAggregatedData),
        }]
      }
    },
  
    aggregateData() {
      // 現在の年度を取得
      const currentYear = new Date().getFullYear();
      // 今週の日付範囲を取得
      const weekDates = this.getWeekDates();

      // 日付の形式の修正、chromeとEdge以外のブラウザに対応したDateオブジェクトの生成方法
      const weekStart = new Date(`${currentYear}/${weekDates[0].substring(0, weekDates[0].indexOf('('))}`);
      const weekEnd = new Date(`${currentYear}/${weekDates[6].substring(0, weekDates[6].indexOf('('))}`);

      weekEnd.setDate(weekEnd.getDate() + 1); // 終了日の翌日を設定

      // 今週のデータをフィルタリング
      const thisWeekRecords = this.records.filter(record => {
        const recordDate = new Date(record.date);
        // 該当する週のデータを渡す
        return recordDate >= weekStart && recordDate < weekEnd;
      });

      // ------------ 抽出した週間データを、分単位の数列に変換してdatasetsに格納 ------------

      // datasetsに挿入する空の配列を生成
      let aggregatedData = [0, 0, 0, 0, 0, 0, 0];

      thisWeekRecords.forEach(record => {
        // "HH/mm"形式の時刻を、数列の分単位に変換
        let parts = record.time.split(":"); 

        // parseInt関数で、文字列を10進数の数字に変換
        let hours = parseInt(parts[0], 10); 
        let minutes = parseInt(parts[1], 10); 
        // 時間を分に変換してから時間の合計
        let time = hours * 60 + minutes; 

        // ------------ 作業の記録を曜日ごとに分類 ------------

        const recordDate = new Date(record.date);
        const dayOfWeek = recordDate.getDay(); // 0 (日曜) から 6 (土曜) までの数値を取得
        const index = (dayOfWeek + 6) % 7; // 月曜を0とするためにインデックスを調整
        aggregatedData[index] += time; // 対応する曜日のデータに時間を加算
        this.weekRecordsTime += time ;  // 週の合計作業時間を算出    
      })
      // データセットの更新
      this.chartData = {
        ...this.chartData,
        datasets: [{
          ...this.chartData.datasets[0],
          data: aggregatedData
        }]
      };

      // 週の合計作業時間の単位を変形
      let hours = Math.floor(this.weekRecordsTime / 60);
      let minutes = this.weekRecordsTime % 60;
      this.weekRecordsTime = hours + '時間' + minutes + '分';

      this.referenceTodaydata();
    },
  }
}
</script>

<style scoped>

.content {
  margin-left: 300px; /* Adjust this value as needed */
}
.pie-chart-container {
  display: flex;        /* Flexboxを有効にすることで、親要素のコンテナを用いて */
  width: 80%;           /* プロパティの持たない<Pie>のサイズを調整する */
  height: 80%; 
  margin: auto; /* フレックスアイテムが一つの時の中央位置に有効な記述 */
  margin-top: 35px; /* 上部に35pxのマージンを追加(後から記述することでマージンを上書きできる) */
  
}

/* サイドバー非表示には、不要な余白を削除する */

@media only screen and (max-width: 1252px) {
  .content {
    margin-left: 0; /* Adjust this value as needed */
  }
}
</style>