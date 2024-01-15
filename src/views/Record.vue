<template>
    <v-app>
      <SidebarSum class="sidebar"/>
       
      
      <div class="content">
        <v-btn @click="changeWeek(-1)">先週</v-btn>
        <v-btn @click="changeWeek(1)">翌週</v-btn>
        <Recoding />

        
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
  import SidebarSum from '@/components/layouts/SidebarSum.vue';

  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)
  
  export default {
    name: 'BarChart',
    components: { Bar,Recoding,SidebarSum },
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

        //この2文からがほんとうにあかんみたい
        //曜日の初め（年月日曜日構成）が正常表記になる

        //多分あかんのこれだけかも？非正規系のdateオブジェクト生成やから
        //んん？下のnew Date(record.date)と生成結果は同じじゃないと、条件判別のための
        //この二つ使えへんのでは？いや過程だけでも歪やとあかん、結果おなじかつ手順違うやつにかえなあかんのかも。

        // const weekStart = new Date(`${currentYear}/${weekDates[0]}`);
        // const weekEnd = new Date(`${currentYear}/${weekDates[6]}`);

        //日付の形式の修正、chromeとEdge以外のブラウザに対応したDateオブジェクトの生成方法

        const weekStart = new Date(`${currentYear}/${weekDates[0].substring(0, weekDates[0].indexOf('('))}`);
const weekEnd = new Date(`${currentYear}/${weekDates[6].substring(0, weekDates[6].indexOf('('))}`);

        // console.log(weekStart, weekEnd)


        weekEnd.setDate(weekEnd.getDate() + 1); // 終了日の翌日を設定
  
        // 今週のデータをフィルタリング
        const thisWeekRecords =this.records.filter(record => {
          const recordDate = new Date(record.date);
          
          
          // recordDateが該当する1週間にあてはまる場合のみ、recordDateをかえす、の認識でいい思う、2true条件
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



        //円グラフの作成


         // 今日の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日の作業データをフィルタリング
    const todayRecords = this.records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= today && recordDate < today + 1;
    });
    console.log("今日の記録",todayRecords)

    // 内容ごとに作業時間を集計
    const todayAggregatedData = {};
    todayRecords.forEach(record => {
      let parts = record.time.split(":");
      let hours = parseInt(parts[0], 10);
      let minutes = parseInt(parts[1], 10);
      let time = hours * 60 + minutes;

      if (!todayAggregatedData[record.contents]) {
        todayAggregatedData[record.contents] = 0;
      }
      todayAggregatedData[record.contents] += time;
    });

    console.log("今日の記録の集計",todayAggregatedData)

    // 集計したデータをもとに円グラフのデータを作成
    this.pieChartData = {
      labels: Object.keys(todayAggregatedData),
      datasets: [{
        data: Object.values(todayAggregatedData),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // 色を設定
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] // ホバー時の色を設定
      }]



    }
    console.log("円グラフデータの出力",this.pieChartData)

      },
    }
  }
  </script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  width: 200px; /* Adjust this value as needed */
}

.content {
  margin-left: 300px; /* Adjust this value as needed */
}
/* 横幅が800pxの時は以下のcssを適応する。
"グラフとサイドバーマージンを0にして不要な余白を削除する */

@media only screen and (max-width: 1000px) {
  .sidebar {
    position: static;
    width: 100%; /* Adjust this value as needed */
  }

  .content {
    margin-left: 0; /* Adjust this value as needed */
  }
}
</style>