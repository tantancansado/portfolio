// firebase-auth.js - Sistema de Autenticación con Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase (reemplaza con tu config)
const firebaseConfig = {
  apiKey: "AIzaSyAxSndE-CSWVBadNaH16nHsucNXOnPbeNQ",
  authDomain: "trading-portfolio-76725.firebaseapp.com",
  projectId: "trading-portfolio-76725",
  storageBucket: "trading-portfolio-76725.firebasestorage.app",
  messagingSenderId: "663381018558",
  appId: "1:663381018558:web:bffc01b7b995441e661bef",
  measurementId: "G-8Q1H5MHR0E"
};

// IMPORTANTE: Reemplaza la config arriba con la tuya de Firebase Console

class FirebaseAuthSystem {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.currentUser = null;
        this.isAuthenticated = false;
        
        this.init();
    }

    async init() {
        try {
            this.createAuthUI();
            this.setupEventListeners();
            
            // Escuchar cambios de autenticación
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    this.currentUser = user;
                }
            });
        } catch (error) {
            console.error("Error initializing Firebase Auth System:", error);
        }
    }
    
    // Método para crear la UI de autenticación (ejemplo básico)
    createAuthUI() {
        // Aquí iría la lógica para mostrar un formulario de login/registro
        console.log("Auth UI created"); // Placeholder
    }
    
    // Método para configurar event listeners (ejemplo básico)
    setupEventListeners() {
        // Aquí irían listeners para los botones de login, registro, etc.
        console.log("Event listeners set up"); // Placeholder
    }

    // Método para registrar un nuevo usuario
    async signup(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Actualizar perfil con nombre visible
            await updateProfile(user, { displayName: displayName });

            // Guardar info adicional del usuario en Firestore si es necesario
            await this.saveUserData(user.uid, { email: user.email, displayName: displayName });

            console.log("User registered successfully:", user);
            return user;
        } catch (error) {
            console.error("Error signing up:", error);
            throw error; // Re-throw para manejar en la UI
        }
    }
    
    // Método para iniciar sesión
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            console.log("User logged in successfully:", user);
            return user;
        } catch (error) {
            console.error("Error logging in:", error);
            throw error; // Re-throw para manejar en la UI
        }
    }
    
    // Método para cerrar sesión
    async logout() {
        try {
            await signOut(this.auth);
            this.currentUser = null;
            this.isAuthenticated = false;
            console.log("User logged out successfully");
        } catch (error) {
            console.error("Error logging out:", error);
            throw error; // Re-throw para manejar en la UI
        }
    }
    
    // Método para guardar datos adicionales del usuario en Firestore
    async saveUserData(uid, data) {
        try {
            const userRef = doc(this.db, "users", uid);
            await setDoc(userRef, data, { merge: true }); // merge: true para no sobrescribir todo si ya existe
            console.log("User data saved successfully for UID:", uid);
        } catch (error) {
            console.error("Error saving user data:", error);
            throw error; // Re-throw para manejar en la UI
        }
    }

    // Método para obtener datos adicionales del usuario desde Firestore
    async getUserData(uid) {
        try {
            const userRef = doc(this.db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                console.log("User data retrieved for UID:", uid);
                return userSnap.data();
            } else {
                console.log("No user data found for UID:", uid);
                return null;
            }
        } catch (error) {
            console.error("Error retrieving user data:", error);
            throw error; // Re-throw para manejar en la UI
        }
    }
    
    // Método para verificar si el usuario está autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Método para obtener el usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Método para requerir autenticación antes de una acción
    requireAuth() {
        if (!this.isAuthenticated()) {
            console.warn("Authentication required");
            // Redirigir al login o mostrar mensaje
            return false;
        }
        return true;
    }
}

// Exportar una instancia única del sistema de autenticación
const firebaseAuth = new FirebaseAuthSystem();
window.firebaseAuth = firebaseAuth; // Hacerlo accesible globalmente para demostración

// Inicializar la app cuando el DOM esté listo (si aún no se hizo)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeApp === 'function' && typeof firebaseAuth !== 'undefined') {
        // initializeApp ya se llama dentro de la clase
        //firebaseAuth.init(); // La inicialización ya se hace en el constructor
        console.log("Firebase Auth System initialized and accessible via window.firebaseAuth");
    } else {
        console.error("Firebase SDKs not loaded correctly or firebaseAuth not initialized.");
    }
});

// Exportar para uso con módulos si es necesario
export default firebaseAuth;