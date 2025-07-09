document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault(); 

    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;
    const id_laboratorio = document.getElementById("id_laboratorio").value;
    const id_nivel = document.getElementById("id_nivel").value;
    const message = document.getElementById("message");

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, correo, password, id_laboratorio, id_nivel })
        });

        const data = await response.json();
        if (response.ok) {
            message.style.color = "green";
            message.textContent = data.message;
            document.getElementById("registerForm").reset(); 
        } else {
            message.style.color = "red";
            message.textContent = data.message;
        }
    } catch (error) {
        message.style.color = "red";
        message.textContent = "Error en la conexión con el servidor.";
    }
});
