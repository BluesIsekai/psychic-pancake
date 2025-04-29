document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const loginFormDiv = document.getElementById('loginForm');
    const registerFormDiv = document.getElementById('registerForm');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    // Check if logged in
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
        welcomeUsername.textContent = user.username;
        loginFormDiv.style.display = 'none';
        welcomeScreen.style.display = 'block';
    }

    // Form navigation
    document.getElementById('showRegister').onclick = (e) => {
        e.preventDefault();
        loginFormDiv.style.display = 'none';
        registerFormDiv.style.display = 'block';
    };

    document.getElementById('showLogin').onclick = (e) => {
        e.preventDefault();
        registerFormDiv.style.display = 'none';
        loginFormDiv.style.display = 'block';
    };

    // Logout
    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('user');
        welcomeScreen.style.display = 'none';
        loginFormDiv.style.display = 'block';
    };

    // Login
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                loginError.textContent = data.error;
                return;
            }

            sessionStorage.setItem('user', JSON.stringify({ username: data.username }));
            welcomeUsername.textContent = data.username;
            loginFormDiv.style.display = 'none';
            welcomeScreen.style.display = 'block';
            loginForm.reset();
        } catch (error) {
            loginError.textContent = 'Server error';
        }
    };

    // Register
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (!response.ok) {
                registerError.textContent = data.error;
                return;
            }

            registerFormDiv.style.display = 'none';
            loginFormDiv.style.display = 'block';
            registerForm.reset();
            loginError.textContent = 'Registration successful! Please login.';
        } catch (error) {
            registerError.textContent = 'Server error';
        }
    };
});