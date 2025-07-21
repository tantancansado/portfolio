// firebase-auth.js - Sistema de Autenticación con Firebase (CORREGIDO)
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
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAxSndE-CSWVBadNaH16nHsucNXOnPbeNQ",
  authDomain: "trading-portfolio-76725.firebaseapp.com",
  projectId: "trading-portfolio-76725",
  storageBucket: "trading-portfolio-76725.firebasestorage.app",
  messagingSenderId: "663381018558",
  appId: "1:663381018558:web:bffc01b7b995441e661bef",
  measurementId: "G-8Q1H5MHR0E"
};

class FirebaseAuthSystem {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.portfolioData = null;
        this.userData = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
            console.log('Inicializando Firebase...');
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            
            console.log('Firebase inicializado correctamente');
            
            // Crear UI de autenticación
            this.createAuthUI();
            this.setupEventListeners();
            
            // Escuchar cambios de autenticación
            onAuthStateChanged(this.auth, async (user) => {
                if (user) {
                    console.log('Usuario autenticado:', user.email);
                    this.currentUser = user;
                    this.isAuthenticated = true;
                    
                    // Cargar datos del usuario
                    await this.loadUserData();
                    
                    // Mostrar aplicación principal
                    this.showMainApp();
                } else {
                    console.log('Usuario no autenticado');
                    this.currentUser = null;
                    this.isAuthenticated = false;
                    this.portfolioData = null;
                    this.userData = null;
                    this.showAuthForm();
                }
            });
            
            console.log('Sistema de autenticación configurado');
            return true;
        } catch (error) {
            console.error("Error inicializando Firebase:", error);
            // Fallback al sistema local si Firebase falla
            this.showAuthForm();
            return false;
        }
    }

    // Crear interfaz de autenticación
    createAuthUI() {
        // Verificar si ya existe
        if (document.getElementById('authOverlay')) {
            return;
        }

        const authHTML = `
            <div id="authOverlay" class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>📈 Trading Portfolio</h1>
                        <p>Accede a tu cartera de inversiones</p>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Iniciar Sesión</button>
                        <button class="auth-tab" data-tab="register">Registrarse</button>
                    </div>
                    
                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form active">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" required placeholder="tu@email.com">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Contraseña</label>
                            <input type="password" id="loginPassword" required placeholder="Tu contraseña">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Iniciar Sesión</button>
                    </form>
                    
                    <!-- Register Form -->
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label for="registerEmail">Email</label>
                            <input type="email" id="registerEmail" required placeholder="tu@email.com">
                        </div>
                        <div class="form-group">
                            <label for="registerDisplayName">Nombre completo</label>
                            <input type="text" id="registerDisplayName" required placeholder="Tu nombre completo">
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Contraseña</label>
                            <input type="password" id="registerPassword" required placeholder="Mínimo 6 caracteres">
                        </div>
                        <div class="form-group">
                            <label for="registerConfirmPassword">Confirmar contraseña</label>
                            <input type="password" id="registerConfirmPassword" required placeholder="Confirma tu contraseña">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Registrarse</button>
                    </form>
                    
                    <div class="auth-demo">
                        <p>¿Quieres probar sin registrarte?</p>
                        <button class="btn btn-secondary btn-small" type="button" id="demoBtn">
                            Usar Demo
                        </button>
                        <small>demo@test.com | demo123</small>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos
        this.addAuthStyles();
        
        // Insertar HTML
        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    addAuthStyles() {
        if (document.getElementById('authStyles')) {
            return;
        }

        const authStyles = document.createElement('style');
        authStyles.id = 'authStyles';
        authStyles.textContent = `
            .auth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--bg-gradient);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.5s ease;
            }

            .auth-container {
                background: var(--glass-bg);
                backdrop-filter: blur(40px) saturate(180%);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                padding: 40px;
                width: 100%;
                max-width: 450px;
                box-shadow: 
                    0 20px 60px var(--shadow-dark),
                    inset 0 1px 0 var(--shadow-light);
                animation: scaleIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .auth-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .auth-header h1 {
                color: var(--text-primary);
                font-size: 2.5em;
                font-weight: 800;
                margin-bottom: 8px;
            }

            .auth-header p {
                color: var(--text-secondary);
                font-size: 1.1em;
            }

            .auth-tabs {
                display: flex;
                margin-bottom: 30px;
                border-radius: 12px;
                background: var(--input-bg);
                padding: 4px;
            }

            .auth-tab {
                flex: 1;
                padding: 12px 16px;
                border: none;
                background: transparent;
                color: var(--text-secondary);
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .auth-tab.active {
                background: var(--card-bg);
                color: var(--text-primary);
                box-shadow: 0 2px 8px var(--shadow-dark);
            }

            .auth-form {
                display: none;
            }

            .auth-form.active {
                display: block;
                animation: fadeInUp 0.4s ease;
            }

            .btn-full {
                width: 100%;
                margin-top: 20px;
            }

            .auth-demo {
                margin-top: 30px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid var(--table-border);
            }

            .auth-demo p {
                color: var(--text-secondary);
                margin-bottom: 12px;
                font-size: 0.9em;
            }

            .auth-demo small {
                display: block;
                color: var(--text-muted);
                font-size: 0.8em;
                margin-top: 8px;
            }

            .auth-loading {
                text-align: center;
                color: var(--text-secondary);
                padding: 20px;
            }

            @media (max-width: 480px) {
                .auth-container {
                    margin: 20px;
                    padding: 30px 24px;
                }
            }
        `;
        document.head.appendChild(authStyles);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Prevenir múltiples listeners
        if (this.listenersSetup) {
            return;
        }
        this.listenersSetup = true;

        // Tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Demo button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'demoBtn') {
                this.fillDemoCredentials();
            }
        });

        // Forms
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                await this.handleLogin(e);
            } else if (e.target.id === 'registerForm') {
                e.preventDefault();
                await this.handleRegister(e);
            }
        });
    }

    // Manejar login
    async handleLogin(e) {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Iniciando sesión...';
        submitBtn.disabled = true;

        try {
            await this.login(email, password);
        } catch (error) {
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Manejar registro
    async handleRegister(e) {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const displayName = document.getElementById('registerDisplayName').value;
        
        if (password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Registrando...';
        submitBtn.disabled = true;

        try {
            await this.signup(email, password, displayName);
            this.showNotification('Registro exitoso. ¡Bienvenido!', 'success');
        } catch (error) {
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Cambiar tabs
    switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    // Llenar credenciales demo
    fillDemoCredentials() {
        this.switchTab('login');
        document.getElementById('loginEmail').value = 'demo@test.com';
        document.getElementById('loginPassword').value = 'demo123';
    }

    // Registrar usuario
    async signup(email, password, displayName) {
        await this.initPromise; // Esperar a que Firebase esté listo
        
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: displayName });
        
        // Crear datos iniciales del usuario
        await this.saveUserData(user.uid, {
            email: user.email,
            displayName: displayName,
            settings: {
                theme: 'dark',
                currency: 'USD',
                notifications: true
            },
            createdAt: new Date().toISOString()
        });

        // Crear portfolio inicial vacío
        await this.savePortfolio([], '📈 Mi Cartera de Trading');
        
        return user;
    }
    
    // Iniciar sesión
    async login(email, password) {
        await this.initPromise; // Esperar a que Firebase esté listo
        
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        return userCredential.user;
    }
    
    // Cerrar sesión
    async logout() {
        try {
            await signOut(this.auth);
            this.showNotification('Sesión cerrada exitosamente', 'success');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            this.showNotification('Error al cerrar sesión', 'error');
        }
    }
    
    // Guardar datos del usuario
    async saveUserData(uid, data) {
        await this.initPromise;
        const userRef = doc(this.db, "users", uid);
        await setDoc(userRef, data, { merge: true });
    }

    // Obtener datos del usuario
    async getUserData(uid) {
        await this.initPromise;
        const userRef = doc(this.db, "users", uid);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? userSnap.data() : null;
    }

    // Cargar datos del usuario actual
    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Cargar datos del usuario
            this.userData = await this.getUserData(this.currentUser.uid);
            
            // Cargar portfolio
            const portfolioRef = doc(this.db, "portfolios", this.currentUser.uid);
            const portfolioSnap = await getDoc(portfolioRef);
            
            if (portfolioSnap.exists()) {
                this.portfolioData = portfolioSnap.data();
            } else {
                // Crear portfolio inicial
                this.portfolioData = {
                    name: '📈 Mi Cartera de Trading',
                    stocks: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await this.savePortfolio([], '📈 Mi Cartera de Trading');
            }
            
            console.log('Datos del usuario cargados:', this.userData);
            console.log('Portfolio cargado:', this.portfolioData);
            
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            // Crear datos por defecto en caso de error
            this.userData = {
                settings: { theme: 'dark', currency: 'USD', notifications: true }
            };
            this.portfolioData = {
                name: '📈 Mi Cartera de Trading',
                stocks: []
            };
        }
    }

    // Guardar portfolio
    async savePortfolio(stocks, name = null) {
        if (!this.currentUser) return;
        
        await this.initPromise;
        
        const portfolioData = {
            name: name || this.portfolioData?.name || '📈 Mi Cartera de Trading',
            stocks: stocks,
            updatedAt: new Date().toISOString(),
            userId: this.currentUser.uid
        };
        
        if (!this.portfolioData?.createdAt) {
            portfolioData.createdAt = new Date().toISOString();
        }
        
        const portfolioRef = doc(this.db, "portfolios", this.currentUser.uid);
        await setDoc(portfolioRef, portfolioData, { merge: true });
        
        // Actualizar datos locales
        this.portfolioData = portfolioData;
        
        console.log('Portfolio guardado en Firebase');
    }

    // Guardar configuraciones del usuario
    async saveUserSettings(settings) {
        if (!this.currentUser) return;
        
        await this.initPromise;
        
        const userRef = doc(this.db, "users", this.currentUser.uid);
        await updateDoc(userRef, {
            settings: settings,
            updatedAt: new Date().toISOString()
        });
        
        // Actualizar datos locales
        if (this.userData) {
            this.userData.settings = settings;
        }
    }

    // Mostrar aplicación principal
    showMainApp() {
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'none';
        }
        
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'block';
        }
        
        // Actualizar info del usuario
        this.updateUserInfo();
        
        // Disparar evento personalizado para que la aplicación sepa que puede inicializarse
        window.dispatchEvent(new CustomEvent('firebaseAuthReady', {
            detail: {
                user: this.currentUser,
                userData: this.userData,
                portfolioData: this.portfolioData
            }
        }));
    }

    // Mostrar formulario de autenticación
    showAuthForm() {
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'flex';
        }
        
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }
    }

    // Actualizar información del usuario
    updateUserInfo() {
        if (!this.isAuthenticated || !this.currentUser) return;
        
        let userBar = document.getElementById('userBar');
        if (!userBar) {
            userBar = document.createElement('div');
            userBar.id = 'userBar';
            userBar.className = 'user-bar';
            
            const themeSelector = document.querySelector('.theme-selector');
            if (themeSelector && themeSelector.parentNode) {
                themeSelector.parentNode.insertBefore(userBar, themeSelector.nextSibling);
            } else {
                document.body.appendChild(userBar);
            }
        }
        
        const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        userBar.innerHTML = `
            <div class="user-info">
                <span class="user-avatar">👤</span>
                <div class="user-details">
                    <span class="user-name">${displayName}</span>
                    <span class="user-role">Trader</span>
                </div>
            </div>
            <button class="btn btn-secondary btn-small" onclick="firebaseAuth.logout()">
                🚪 Cerrar Sesión
            </button>
        `;
        
        // Agregar estilos si no existen
        this.addUserBarStyles();
    }

    addUserBarStyles() {
        if (document.getElementById('userBarStyles')) {
            return;
        }

        const userBarStyles = document.createElement('style');
        userBarStyles.id = 'userBarStyles';
        userBarStyles.textContent = `
            .user-bar {
                position: fixed;
                top: 20px;
                left: 20px;
                background: var(--glass-bg);
                backdrop-filter: blur(24px) saturate(180%);
                border: 1px solid var(--glass-border);
                border-radius: 20px;
                padding: 16px 20px;
                display: flex;
                gap: 16px;
                align-items: center;
                z-index: 100;
                animation: slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 32px var(--shadow-dark);
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .user-avatar {
                width: 40px;
                height: 40px;
                background: var(--card-bg);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2em;
                border: 2px solid var(--glass-border);
            }

            .user-details {
                display: flex;
                flex-direction: column;
            }

            .user-name {
                color: var(--text-primary);
                font-weight: 700;
                font-size: 0.95em;
            }

            .user-role {
                color: var(--text-secondary);
                font-size: 0.8em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @media (max-width: 768px) {
                .user-bar {
                    top: 10px;
                    left: 10px;
                    padding: 12px 16px;
                }
                
                .user-details {
                    display: none;
                }
            }
        `;
        document.head.appendChild(userBarStyles);
    }

    // Verificar autenticación
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showNotification('Debes iniciar sesión para realizar esta acción', 'error');
            this.showAuthForm();
            return false;
        }
        return true;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.isAuthenticated ? this.currentUser : null;
    }

    // Mostrar notificación
    showNotification(message, type = 'success') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Obtener mensaje de error amigable
    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/invalid-email': 'Email inválido',
            'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
        };
        
        return errorMessages[error.code] || error.message || 'Error desconocido';
    }
}

// Crear instancia única
const firebaseAuth = new FirebaseAuthSystem();

// Hacer disponible globalmente
window.firebaseAuth = firebaseAuth;

console.log('Firebase Auth System cargado');

export default firebaseAuth;