// Register the Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered! Scope:', registration.scope);
            })
            .catch(err => {
                console.error('Service Worker registration failed:', err);
            });
    });
}

  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDhPpzjlJ_SdN8c6RMninbITyEyEZZ1kC4",
    authDomain: "language-app-c0291.firebaseapp.com",
    projectId: "language-app-c0291",
    storageBucket: "language-app-c0291.firebasestorage.app",
    messagingSenderId: "1098129446152",
    appId: "1:1098129446152:web:085f54b4c5cacf23da48bd",
    measurementId: "G-D0HLJJVPL1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  // Get DOM elements
const signInBtn = document.getElementById('signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userPicImg = document.getElementById('user-pic');

// Get a reference to the Firebase auth service
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Sign in with Google
function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .then(result => {
            console.log('User signed in:', result.user);
        })
        .catch(error => {
            console.error('Error during sign in:', error);
        });
}

// Sign out
function signOutUser() {
    auth.signOut()
        .then(() => {
            console.log('User signed out.');
        })
        .catch(error => {
            console.error('Error during sign out:', error);
        });
}
// Auth state change listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userInfoDiv.hidden = false;
        signInBtn.hidden = true;

        // Display user info
        userNameSpan.textContent = user.displayName;
        userPicImg.src = user.photoURL;

    } else {
        // User is signed out
        userInfoDiv.hidden = true;
        signInBtn.hidden = false;
    }
});
// Add click event listeners
signInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOutUser);