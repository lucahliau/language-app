// 1. Import all the Firebase functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
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
const authContainer = document.getElementById('auth-container');
const mainAppContainer = document.getElementById('main-app-container');
const googleSignInBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const emailSignInBtn = document.getElementById('email-signin-btn');
const createAccountBtn = document.getElementById('create-account-btn');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userPicImg = document.getElementById('user-pic');

// 5. Authentication Logic
function signInWithGoogle() {
    signInWithPopup(auth, provider)
        .catch(error => console.error('Google Sign In Error:', error));
}

function createAccount() {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return alert('Please enter email and password.');

    createUserWithEmailAndPassword(auth, email, password)
        .catch(error => alert(`Account Creation Error: ${error.message}`));
}

function signInWithEmail() {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return alert('Please enter email and password.');

    signInWithEmailAndPassword(auth, email, password)
        .catch(error => alert(`Sign In Error: ${error.message}`));
}

function doSignOut() {
    signOut(auth).catch(error => console.error('Sign Out Error:', error));
}

// 6. Auth state listener (THE MOST IMPORTANT PART)
onAuthStateChanged(auth, user => {
    if (user) {
        // User is signed in, show the main app and hide the auth screen
        mainAppContainer.hidden = false;
        authContainer.hidden = true;

        // Display user info in the profile tab
        userNameSpan.textContent = user.displayName || user.email;
        if (user.photoURL) {
            userPicImg.src = user.photoURL;
        } else {
            // Provide a default avatar if no photo exists
            userPicImg.src = `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`;
        }

    } else {
        // User is signed out, show the auth screen and hide the main app
        mainAppContainer.hidden = true;
        authContainer.hidden = false;
    }
});

// 7. Add click event listeners
googleSignInBtn.addEventListener('click', signInWithGoogle);
createAccountBtn.addEventListener('click', createAccount);
emailSignInBtn.addEventListener('click', signInWithEmail);
signOutBtn.addEventListener('click', doSignOut);

// 8. Tab Bar Logic
const tabBar = document.getElementById('tab-bar');
const appPages = document.querySelectorAll('.page');
tabBar.addEventListener('click', (event) => {
    if (event.target.matches('.tab-item')) {
        const pageIdToShow = event.target.dataset.page;
        appPages.forEach(page => page.hidden = true);
        document.getElementById(pageIdToShow).hidden = false;
        tabBar.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
    }
});

// 9. Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}