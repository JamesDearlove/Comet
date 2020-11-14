import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDi2xnCbASukYXnepa8_8FPEd-t9XlQIV0",
  authDomain: "jimmysocial-e961a.firebaseapp.com",
  databaseURL: "https://jimmysocial-e961a.firebaseio.com",
  projectId: "jimmysocial-e961a",
  storageBucket: "jimmysocial-e961a.appspot.com",
  messagingSenderId: "1001720930483",
  appId: "1:1001720930483:web:5399f9d4cb5e4ec3fe50c6"
};

firebase.initializeApp(firebaseConfig);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
