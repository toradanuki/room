import firebase from 'firebase';

var firebaseConfig = {
    apiKey: "AIzaSyCTJExgIIPvb4nY0Mm0silDycONR3KqIsA",
    authDomain: "vue-cchat.firebaseapp.com",
    projectId: "vue-cchat",
    storageBucket: "vue-cchat.appspot.com",
    messagingSenderId: "289925521051",
    appId: "1:289925521051:web:829e3526eb8b449510703e"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase;