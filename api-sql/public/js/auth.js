function validarSesion() {
    const user = localStorage.getItem("user");
    if (!user) {
        // 🔁 Redirige al login
        window.location.href = "login.html";
    }
}
