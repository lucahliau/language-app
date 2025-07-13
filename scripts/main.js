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
    getFirestore, doc, setDoc, getDoc
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
const quizQuestionText = document.getElementById('quiz-question-text');
const quizAnswersContainer = document.getElementById('quiz-answers');
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
function fetchQuestion(difficulty) {
    // Find all questions at the target difficulty that haven't been answered yet
    const availableQuestions = DIAGNOSTIC_QUESTIONS.filter(q => 
      q.difficulty === difficulty && !answeredQuestionIds.has(q.id)
    );
  
    if (availableQuestions.length > 0) {
      const question = availableQuestions[0]; // Get the first available one
      answeredQuestionIds.add(question.id); // Mark it as used
      return question;
    }
  
    // If no questions at the target difficulty, find ANY available question
    console.warn(`No new questions at difficulty ${difficulty}. Searching all levels.`);
    const anyNewQuestion = DIAGNOSTIC_QUESTIONS.filter(q => !answeredQuestionIds.has(q.id));
    if (anyNewQuestion.length > 0) {
      const question = anyNewQuestion[0];
      answeredQuestionIds.add(question.id);
      return question;
    }
  
    return null; // No questions left
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

function handleAnswer(event) {
    if (!event.target.matches('.quiz-answer-btn')) return;

    quizAnswersContainer.removeEventListener('click', handleAnswer);

    const selectedAnswer = event.target.dataset.answer;
    const lastQuestionId = [...answeredQuestionIds].pop();
    const question = DIAGNOSTIC_QUESTIONS.find(q => q.id === lastQuestionId);
    const correctAnswer = question.correctAnswer;

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

function startNextQuestion() {
    const question = fetchQuestion(currentDifficulty);
    if (question) {
        displayQuestion(question);
        quizAnswersContainer.addEventListener('click', handleAnswer);
    } else {
        // No more questions left, end the quiz
        endDiagnostic();
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
// NEW: Hardcoded Diagnostic Question Bank
const DIAGNOSTIC_QUESTIONS = [
    { id: 'q1', difficulty: 1, questionText: 'Which word means "a person who loves books"?', options: ['Bibliophile', 'Philistine', 'Lexicographer', 'Polyglot'], correctAnswer: 'Bibliophile' },
    { id: 'q2', difficulty: 1, questionText: 'A story that has been passed down through generations is a _____.', options: ['Tale', 'Folklore', 'Anecdote', 'Myth'], correctAnswer: 'Folklore' },
    { id: 'q3', difficulty: 2, questionText: 'To _______ is to make a situation worse or more severe.', options: ['Ameliorate', 'Exacerbate', 'Alleviate', 'Assuage'], correctAnswer: 'Exacerbate' },
    { id: 'q4', difficulty: 2, questionText: 'Something that is _______ is commonplace or lacks originality.', options: ['Exceptional', 'Novel', 'Banal', 'Esteemed'], correctAnswer: 'Banal' },
    { id: 'q5', difficulty: 3, questionText: 'His argument was _______, filled with subtle but serious flaws.', options: ['Cogent', 'Trenchant', 'Specious', 'Perspicacious'], correctAnswer: 'Specious' },
    { id: 'q6', difficulty: 3, questionText: 'She had a _______ for making friends easily.', options: ['Penchant', 'Aversion', 'Constraint', 'Liability'], correctAnswer: 'Penchant' },
  ];