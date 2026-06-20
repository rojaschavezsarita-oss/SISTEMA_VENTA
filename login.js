const USUARIO = 'konny';
const CLAVE = 'konny12';

function iniciarSesion() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === USUARIO && pass === CLAVE) {
        // Guardamos un token de sesión temporal y redirigimos al index
        sessionStorage.setItem('auth', 'true');
        window.location.href = 'index.html';
    } else {
        document.getElementById('login-error').innerText = "Usuario o contraseña incorrectos.";
    }
}