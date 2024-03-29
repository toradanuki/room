import Vue from 'vue'
import VueRouter from 'vue-router'
import RoomList from '../views/RoomList.vue'
import ChatBoard from '../views/ChatBoard.vue'
import RoomChatBoard from '../views/RoomChatBoard.vue'
import Login from '../views/Login.vue'
import SignUp from '../views/SignUp.vue'
import Profile from '../views/Profile.vue'
import Board from '../views/Board.vue'
import Record from '../views/Record.vue'
import FriendList from '../views/FriendList.vue'
import Test from '../views/Test.vue'
import PairRoom from '../views/PairRoom.vue'
import PublishProfile from '../views/PublishProfile.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'RoomList',
    component: RoomList,
    meta: { requiresAuth: true }
  },
  {
    path: '/Chat',
    name: 'ChatBoard',
    component: ChatBoard
  },
  {
    path: '/RoomChat',
    name: 'RoomChatBoard',
    component: RoomChatBoard
  },
  {
    path: '/FriendList',
    name: 'FriendList',
    component: FriendList
  },
  {
    path: '/Profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/Board',
    name: 'Board',
    component: Board
  },
  {
    path: '/Record',
    name: 'Record',
    component: Record
  },
  {
    path: '/Login',
    name: 'Login',
    component: Login
  },
  {
    path: '/Sign',
    name: 'SignUp',
    component: SignUp
  },
  {
    path: '/Test',
    name: 'Test',
    component: Test
  },
  {
    path: '/PairRoom',
    name: 'PairRoom',
    component: PairRoom
  },
  {
    path: '/user',
    name: 'PublishProfile',
    component: PublishProfile
  },
]

const router = new VueRouter({
  routes,
// ページ遷移時、スクロールの位置をトップに戻す
  scrollBehavior () {
    return { x: 0, y: 0 }
  }
})

// 認証済ユーザーであるか識別
router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')
  // 未認証のユーザーかつログイン、登録ページ以外の接続であれば、ログインページにリダイレクトする
  if ((to.path !== '/login' && to.path !== '/Sign') && !user) {
    next({
      path: '/login',
    })
  } else {
    next()
  }
})

export default router
