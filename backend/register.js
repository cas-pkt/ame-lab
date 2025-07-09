document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const id_laboratorio = document.getElementById("laboratorio").value;
    const id_rol = document.getElementById("role").value;  // Capturar id_rol (id_nivel)

    const data = { nombre: name, correo: email, password, id_laboratorio, id_rol };

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Registro exitoso: Laboratorio ${id_laboratorio}, Nivel ${id_rol}`);
            window.location.href = "login.html";
        } else {
            alert(result.message || "Error en el registro");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Hubo un problema con el registro");
    }
});
