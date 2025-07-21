// auth.js - Sistema de Autenticación para Trading Portfolio
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.users = this.loadUsers();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        this.sessionTimer = null;
        
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.createAuthUI();
        this.setupEventListeners();
    }

    // Cargar usuarios desde localStorage
    loadUsers() {
        const users = localStorage.getItem('tradingUsers');
        if (!users) {
            // Crear usuario demo por defecto
            const defaultUsers = {
                'demo': {
                    username: 'demo',
                    password: this.hashPassword('demo123'),
                    email: 'demo@trading.com',
                    displayName: 'Usuario Demo',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    settings: {
                        theme: 'dark',
                        currency: 'USD',
                        notifications: true
                    }
                }
            };
            this.saveUsers(defaultUsers);
            return defaultUsers;
        }
        return JSON.parse(users);
    }

    // Guardar usuarios en localStorage
    saveUsers(users = this.users) {
        localStorage.setItem('tradingUsers', JSON.stringify(users));
    }

    // Hash simple para contraseñas (en producción usar bcrypt o similar)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit
        }
        return hash.toString();
    }

    // Verificar sesión existente
    checkExistingSession() {
        const session = localStorage.getItem('tradingSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();
                
                if (now - sessionData.timestamp < this.sessionTimeout) {
                    this.currentUser = sessionData.user;
                    this.isAuthenticated = true;
                    this.updateSessionTimestamp();
                    this.startSessionTimer();
                    this.showMainApp();
                    return true;
                }
            } catch (error) {
                console.error('Error al verificar sesión:', error);
            }
        }
        
        this.logout(false);
        return false;
    }

    // Actualizar timestamp de sesión
    updateSessionTimestamp() {
        if (this.isAuthenticated) {
            const sessionData = {
                user: this.currentUser,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('tradingSession', JSON.stringify(sessionData));
        }
    }

    // Iniciar timer de sesión
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        this.sessionTimer = setTimeout(() => {
            this.showNotification('Tu sesión ha expirado', 'error');
            this.logout();
        }, this.sessionTimeout);
    }

    // Login de usuario
    async login(username, password) {
        try {
            const hashedPassword = this.hashPassword(password);
            const user = this.users[username];
            
            if (!user || user.password !== hashedPassword) {
                throw new Error('Usuario o contraseña incorrectos');
            }

            // Actualizar último login
            user.lastLogin = new Date().toISOString();
            this.users[username] = user;
            this.saveUsers();

            // Establecer sesión
            this.currentUser = user;
            this.isAuthenticated = true;
            this.updateSessionTimestamp();
            this.startSessionTimer();
            
            this.showNotification(`¡Bienvenido ${user.displayName}!`, 'success');
            this.showMainApp();
            
            return true;
        } catch (error) {
            this.showNotification(error.message, 'error');
            return false;
        }
    }

    // Registro de nuevo usuario
    async register(userData) {
        try {
            const { username, password, email, displayName } = userData;
            
            // Validaciones
            if (!username || !password || !email || !displayName) {
                throw new Error('Todos los campos son requeridos');
            }
            
            if (username.length < 3) {
                throw new Error('El usuario debe tener al menos 3 caracteres');
            }
            
            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            
            if (this.users[username]) {
                throw new Error('El usuario ya existe');
            }
            
            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Email inválido');
            }

            // Crear nuevo usuario
            const newUser = {
                username,
                password: this.hashPassword(password),
                email,
                displayName,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                settings: {
                    theme: 'dark',
                    currency: 'USD',
                    notifications: true
                }
            };

            this.users[username] = newUser;
            this.saveUsers();
            
            this.showNotification('Usuario registrado exitosamente', 'success');
            return true;
        } catch (error) {
            this.showNotification(error.message, 'error');
            return false;
        }
    }

    // Logout
    logout(showMessage = true) {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('tradingSession');
        
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (showMessage) {
            this.showNotification('Has cerrado sesión exitosamente', 'success');
        }
        
        this.showAuthForm();
    }

    // Crear interfaz de autenticación
    createAuthUI() {
        const authHTML = `
            <div id="authOverlay" class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>🔐 Trading Portfolio</h1>
                        <p>Accede a tu cartera de inversiones</p>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="auth.switchTab('login')">Iniciar Sesión</button>
                        <button class="auth-tab" onclick="auth.switchTab('register')">Registrarse</button>
                    </div>
                    
                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form active">
                        <div class="form-group">
                            <label for="loginUsername">Usuario</label>
                            <input type="text" id="loginUsername" required placeholder="Ingresa tu usuario">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Contraseña</label>
                            <input type="password" id="loginPassword" required placeholder="Ingresa tu contraseña">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Iniciar Sesión</button>
                    </form>
                    
                    <!-- Register Form -->
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label for="registerUsername">Usuario</label>
                            <input type="text" id="registerUsername" required placeholder="Elige un usuario">
                        </div>
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
                        <p>Para probar la aplicación:</p>
                        <button class="btn btn-secondary btn-small" onclick="auth.fillDemoCredentials()">
                            Usar credenciales demo
                        </button>
                        <small>Usuario: demo | Contraseña: demo123</small>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos CSS
        const authStyles = `
            <style id="authStyles">
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

                @media (max-width: 480px) {
                    .auth-container {
                        margin: 20px;
                        padding: 30px 24px;
                    }
                }
            </style>
        `;

        // Insertar estilos y HTML
        document.head.insertAdjacentHTML('beforeend', authStyles);
        document.body.insertAdjacentHTML('beforeend', authHTML);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Form de login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(username, password);
        });

        // Form de registro
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                this.showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            const userData = {
                username: document.getElementById('registerUsername').value,
                email: document.getElementById('registerEmail').value,
                displayName: document.getElementById('registerDisplayName').value,
                password: password
            };

            const success = await this.register(userData);
            if (success) {
                this.switchTab('login');
                // Rellenar campos de login
                document.getElementById('loginUsername').value = userData.username;
            }
        });
    }

    // Cambiar entre tabs de login/register
    switchTab(tab) {
        // Actualizar tabs
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[onclick="auth.switchTab('${tab}')"]`).classList.add('active');
        
        // Actualizar formularios
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    // Rellenar credenciales demo
    fillDemoCredentials() {
        this.switchTab('login');
        document.getElementById('loginUsername').value = 'demo';
        document.getElementById('loginPassword').value = 'demo123';
    }

    // Mostrar aplicación principal
    showMainApp() {
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'none';
        }
        
        // Mostrar contenido principal
        document.querySelector('.container').style.display = 'block';
        
        // Actualizar header con info del usuario
        this.updateUserInfo();
        
        // Cargar datos del usuario
        this.loadUserData();
    }

    // Mostrar formulario de autenticación
    showAuthForm() {
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'flex';
        }
        
        // Ocultar contenido principal
        document.querySelector('.container').style.display = 'none';
    }

    // Actualizar información del usuario en la UI
    updateUserInfo() {
        if (!this.isAuthenticated || !this.currentUser) return;
        
        // Crear o actualizar barra de usuario
        let userBar = document.getElementById('userBar');
        if (!userBar) {
            userBar = document.createElement('div');
            userBar.id = 'userBar';
            userBar.className = 'user-bar';
            userBar.innerHTML = `
                <div class="user-info">
                    <span class="user-avatar">👤</span>
                    <div class="user-details">
                        <span class="user-name">${this.currentUser.displayName}</span>
                        <span class="user-role">Trader</span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-small" onclick="auth.logout()">
                    🚪 Cerrar Sesión
                </button>
            `;
            
            // Insertar después del selector de temas
            const themeSelector = document.querySelector('.theme-selector');
            themeSelector.parentNode.insertBefore(userBar, themeSelector.nextSibling);
        }
        
        // Agregar estilos para la barra de usuario
        if (!document.getElementById('userBarStyles')) {
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
    }

    // Cargar datos específicos del usuario
    loadUserData() {
        if (!this.isAuthenticated || !this.currentUser) return;
        
        // Cargar portfolio específico del usuario
        const userPortfolioKey = `tradingPortfolio_${this.currentUser.username}`;
        const userPortfolio = localStorage.getItem(userPortfolioKey);
        
        if (userPortfolio) {
            window.portfolio = JSON.parse(userPortfolio);
        }
        
        // Cargar configuraciones del usuario
        if (this.currentUser.settings) {
            if (this.currentUser.settings.theme) {
                window.changeTheme(this.currentUser.settings.theme);
            }
        }
        
        // Re-renderizar portfolio
        if (window.renderPortfolio) {
            window.renderPortfolio();
        }
    }

    // Guardar datos del usuario
    saveUserData() {
        if (!this.isAuthenticated || !this.currentUser) return;
        
        // Guardar portfolio específico del usuario
        const userPortfolioKey = `tradingPortfolio_${this.currentUser.username}`;
        if (window.portfolio) {
            localStorage.setItem(userPortfolioKey, JSON.stringify(window.portfolio));
        }
        
        // Actualizar configuraciones del usuario
        this.currentUser.settings = {
            ...this.currentUser.settings,
            theme: window.currentTheme || 'dark'
        };
        
        this.users[this.currentUser.username] = this.currentUser;
        this.saveUsers();
    }

    // Mostrar notificación
    showNotification(message, type = 'success') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Verificar autenticación (para usar en otras funciones)
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showNotification('Debes iniciar sesión para realizar esta acción', 'error');
            this.showAuthForm();
            return false;
        }
        
        // Renovar sesión si está activa
        this.updateSessionTimestamp();
        this.startSessionTimer();
        return true;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.isAuthenticated ? this.currentUser : null;
    }

    // Cambiar contraseña
    async changePassword(oldPassword, newPassword) {
        if (!this.requireAuth()) return false;
        
        try {
            const hashedOldPassword = this.hashPassword(oldPassword);
            if (this.currentUser.password !== hashedOldPassword) {
                throw new Error('Contraseña actual incorrecta');
            }
            
            if (newPassword.length < 6) {
                throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
            }
            
            this.currentUser.password = this.hashPassword(newPassword);
            this.users[this.currentUser.username] = this.currentUser;
            this.saveUsers();
            
            this.showNotification('Contraseña cambiada exitosamente', 'success');
            return true;
        } catch (error) {
            this.showNotification(error.message, 'error');
            return false;
        }
    }
}

// Inicializar sistema de autenticación
window.auth = new AuthSystem();