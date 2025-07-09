document.getElementById("logout").addEventListener("click", function () {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
});
