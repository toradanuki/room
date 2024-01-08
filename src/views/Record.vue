<template>
    <v-app>
        <Recoding />
      <div>
        <v-btn @click="changeWeek(-1)">先週</v-btn>
        <v-btn @click="changeWeek(1)">翌週</v-btn>
        <Bar updateChartData
          id="my-chart-id"
          :options="chartOptions"
          :data="chartData"
        />
        <Pie v-if="pieChartData" :data="pieChartData" />
      </div>
    </v-app>
  </template>
  
  <script>
  import firebase from "@/firebase/firebase"
  import { Bar } from 'vue-chartjs'
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
  import Recoding from '@/components/modal/Recoding.vue';
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)
  
  export default {
    name: 'BarChart',
    components: { Bar,Recoding },
        data() {
          return {
            records:[],
            weekOffset: 0,
            selectedDate: null, // 選択された日付を保存するためのデータプロパティ
            pieChartData: null, // 円グラフのデータを保存するためのデータプロパティ
            thisWeekRecords:[],
            chartData: {
              labels: [],
              datasets: [ { data: [0,0,0,0,0,0,0] } ]
            },
            options: {
            },
            chartOptions: {
              responsive: true,
              
              scales: {
                y: {
                  min: 0, // 最小値を0に設定
                  max: 24 * 60, // 最大値を24時間（1440分）に設定
                  ticks: {
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
    },
  
    mounted() {
      //自身の情報を取得
      const auth = JSON.parse(sessionStorage.getItem('user'))
      const { displayname } = auth
      this.myuserid = auth.userId
      this.auth = auth
      this.names = displayname
      //自身のプロフィールドキュメントを参照
      firebase.firestore().collection("userlist").where("displayname", "==", auth.displayname).get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            this.mydocid = doc.id
          })
          //作業記録の取得と更新
          firebase.firestore().collection("userlist").doc(this.mydocid).collection('records').orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                this.records.push(change.doc.data())
                // this.aggregateData(); // データ集計を行う
              })
              this.aggregateData();
            });
        })  
    },
  
    methods: {
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
      this.weekOffset += offset;
      this.chartData = {
        ...this.chartData,
        labels: this.getWeekDates()
      };
      this.aggregateData();
      },
  
      aggregateData() {
        // 現在の年度を取得
        const currentYear = new Date().getFullYear();
        // 今週の日付範囲を取得
        // 今週の日付範囲を取得
        const weekDates =this.getWeekDates();
        const weekStart = new Date(`${currentYear}/${weekDates[0]}`);
        const weekEnd = new Date(`${currentYear}/${weekDates[6]}`);
        weekEnd.setDate(weekEnd.getDate() + 1); // 終了日の翌日を設定
  
        // 今週のデータをフィルタリング
        const thisWeekRecords =this.records.filter(record => {
          const recordDate = new Date(record.date);
          // console.log("日時取得",recordDate,weekStart)
          console.log("コールバック関数可否確認",recordDate,weekEnd,weekStart)
          // recordDateが該当する1週間にあてはまる場合のみ、true..?わかんね
          return recordDate >= weekStart && recordDate < weekEnd;
        });
  
        // ------------ 抽出した週間データを、dataに反映 ------------
  
        //datasetsに挿入する空の配列を生成
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
        })
        // データセットの更新
        this.chartData = {
          ...this.chartData,
          datasets: [{
            ...this.chartData.datasets[0],
            data: aggregatedData
          }]
        };
      },
    }
  }
  </script>
