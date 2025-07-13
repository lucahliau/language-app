// 1. Import all the Firebase functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// 2. Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhPpzjlJ_SdN8c6RMninbITyEyEZZ1kC4",
    authDomain: "language-app-c0291.firebaseapp.com",
    projectId: "language-app-c0291",
    storageBucket: "language-app-c0291.firebasestorage.app",
    messagingSenderId: "1098129446152",
    appId: "1:1098129446152:web:085f54b4c5cacf23da48bd",
    measurementId: "G-D0HLJJVPL1"
};

// 3. Initialize Firebase and get references to services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 4. Get DOM elements
const signInBtn = document.getElementById('signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userPicImg = document.getElementById('user-pic');

// 5. Functions for Sign In and Sign Out (using modern syntax)
function signInWithGoogle() {
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('User signed in:', result.user);
        })
        .catch(error => {
            console.error('Error during sign in:', error);
        });
}

function doSignOut() {
    signOut(auth)
        .then(() => {
            console.log('User signed out.');
        })
        .catch(error => {
            console.error('Error during sign out:', error);
        });
}

// 6. Auth state listener (using modern syntax)
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in
        userInfoDiv.hidden = false;
        signInBtn.hidden = true;
        userNameSpan.textContent = user.displayName;
        userPicImg.src = user.photoURL;
    } else {
        // User is signed out
        userInfoDiv.hidden = true;
        signInBtn.hidden = false;
    }
});

// 7. Add click event listeners
signInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', doSignOut);

// 8. Service worker registration (from earlier)
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