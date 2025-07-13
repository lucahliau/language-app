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

import { 
    getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, limit
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
const db = getFirestore(app); // <-- Add this line
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
const diagnosticContainer = document.getElementById('diagnostic-container');
const finishDiagnosticBtn = document.getElementById('finish-diagnostic-btn');
// --- QUIZ STATE VARIABLES ---
let currentDifficulty = 2; // Start at medium difficulty
let questionsAnswered = 0;
const TOTAL_DIAGNOSTIC_QUESTIONS = 5; // The quiz will have 5 questions
let answeredQuestionIds = new Set();

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
        .then(userCredential => {
            // User account created successfully. Now, create their profile in Firestore.
            const user = userCredential.user;
            // Create a document reference in the 'users' collection with the user's UID
            const userDocRef = doc(db, "users", user.uid);

            // Set the initial data for the new user
            return setDoc(userDocRef, {
                email: user.email,
                createdAt: new Date(),
                hasCompletedDiagnostic: false, // This is the crucial flag!
                level: 'unassessed'
            });
        })
        .then(() => {
            console.log("User profile created in Firestore.");
            // The onAuthStateChanged listener will automatically handle showing the app.
        })
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

// 6. Auth state listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        // Check if the user document exists and if the diagnostic is complete
        if (userDocSnap.exists() && userDocSnap.data().hasCompletedDiagnostic) {
            // Show the main app if diagnostic is complete
            mainAppContainer.classList.remove('hidden-view');
            authContainer.classList.add('hidden-view');
            diagnosticContainer.classList.add('hidden-view');
        } else {
            // User is new or hasn't finished the diagnostic, so show the quiz
            diagnosticContainer.classList.remove('hidden-view');
            mainAppContainer.classList.add('hidden-view');
            authContainer.classList.add('hidden-view');
            startNextQuestion(); // Start the quiz logic
        }

        // Display user info in the profile tab
        userNameSpan.textContent = user.displayName || user.email;
        if (user.photoURL) {
            userPicImg.src = user.photoURL;
        } else {
            userPicImg.src = `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`;
        }

    } else {
        // User is signed out, show the auth screen
        authContainer.classList.remove('hidden-view');
        mainAppContainer.classList.add('hidden-view');
        diagnosticContainer.classList.add('hidden-view');
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
// --- QUIZ LOGIC ---
async function fetchQuestion(difficulty) {
    const questionsRef = collection(db, "diagnosticQuestions");
    const q = query(questionsRef, where("difficulty", "==", difficulty), limit(10));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.warn(`No questions found for difficulty ${difficulty}. Trying a different level.`);
        return fetchQuestion(difficulty > 1 ? difficulty - 1 : 1); 
    }

    const availableQuestions = querySnapshot.docs.filter(doc => !answeredQuestionIds.has(doc.id));
    
    if (availableQuestions.length === 0) {
        return endDiagnostic();
    }

    const questionDoc = availableQuestions[0];
    answeredQuestionIds.add(questionDoc.id);
    return { id: questionDoc.id, ...questionDoc.data() };
}

function displayQuestion(question) {
    quizQuestionText.textContent = question.questionText;
    quizAnswersContainer.innerHTML = ''; 
    
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'quiz-answer-btn';
        button.textContent = option;
        button.dataset.answer = option;
        quizAnswersContainer.appendChild(button);
    });
}

async function handleAnswer(event) {
    if (!event.target.matches('.quiz-answer-btn')) return;

    quizAnswersContainer.removeEventListener('click', handleAnswer);

    const selectedAnswer = event.target.dataset.answer;
    const questionDoc = await getDoc(doc(db, "diagnosticQuestions", [...answeredQuestionIds].pop()));
    const correctAnswer = questionDoc.data().correctAnswer;

    if (selectedAnswer === correctAnswer) {
        event.target.style.backgroundColor = '#d4edda';
        currentDifficulty++;
    } else {
        event.target.style.backgroundColor = '#f8d7da';
        currentDifficulty--;
    }

    if (currentDifficulty > 3) currentDifficulty = 3;
    if (currentDifficulty < 1) currentDifficulty = 1;

    questionsAnswered++;
    
    setTimeout(() => {
        if (questionsAnswered >= TOTAL_DIAGNOSTIC_QUESTIONS) {
            endDiagnostic();
        } else {
            startNextQuestion();
        }
    }, 1000);
}

async function startNextQuestion() {
    const question = await fetchQuestion(currentDifficulty);
    if (question) {
        displayQuestion(question);
        quizAnswersContainer.addEventListener('click', handleAnswer);
    }
}

function endDiagnostic() {
    const user = auth.currentUser;
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        setDoc(userDocRef, { 
            hasCompletedDiagnostic: true,
            level: currentDifficulty 
        }, { merge: true });

        diagnosticContainer.classList.add('hidden-view');
        mainAppContainer.classList.remove('hidden-view');
    }
}