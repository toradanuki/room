import Vue from 'vue'
import VueRouter from 'vue-router'
// import HomeView from '../views/HomeView.vue'
//  import UserList from '../views/UserList.vue'
import RoomList from '../views/RoomList.vue'
import ChatBoard from '../views/ChatBoard.vue'
import Login from '../views/Login.vue'
import SignUp from '../views/SignUp.vue'
import Profile from '../views/Profile.vue'
import Board from '../views/Board.vue'
import Record from '../views/Record.vue'
import FriendList from '../views/FriendList.vue'


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
  }



]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  if (requiresAuth) {
    const user = sessionStorage.getItem('user')
    console.log(JSON.parse(user))
    if (!user) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
    

  } else {
    next()
  }
})


export default router
