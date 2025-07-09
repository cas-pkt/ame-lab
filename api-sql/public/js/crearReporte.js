


// Obtener usuario logueado
const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
const usuario = JSON.parse(storage.getItem("user"));

async function marcarTodasLeidas() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        await fetch(`/api/notificaciones/marcar-todas/${user.id_usuario}`, { method: "PUT" });
        cargarNotificaciones(); // ✅ Ahora es accesible
    } catch (error) {
        console.error("Error al marcar todas como leídas:", error);
    }
}

// ✅ Mover cargarNotificaciones fuera de DOMContentLoaded
async function cargarNotificaciones() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res = await fetch(`/api/notificaciones/${user.id_usuario}`);
        const notificaciones = await res.json();

        const notifBox = document.querySelector(".notif-center");
        notifBox.innerHTML = `
            <!-- Botón fijo arriba -->
            <button onclick="marcarTodasLeidas()" class="dropdown-item text-center text-primary fw-bold sticky-top bg-light border-0 rounded-3 shadow-sm mb-2">
                Marcar todas como leídas
            </button>
        `;

        if (notificaciones.length === 0) {
            notifBox.innerHTML += `
                <div class="text-center text-muted small py-2">No hay notificaciones nuevas</div>
            `;
        } else {
            notificaciones.forEach(n => {
                notifBox.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center position-relative notification-item p-2 rounded border 
                        ${n.leida ? 'bg-light' : 'bg-white border-primary'}" data-id="${n.id_notificacion}">
                        <a href="#" onclick="marcarLeida(${n.id_notificacion})" class="d-flex w-100 text-decoration-none text-dark">
                            <div class="notif-icon ${n.leida ? 'bg-secondary' : 'bg-primary'} text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                style="width: 40px; height: 40px;">
                                <i class="fa fa-bell" style="font-size: 20px;"></i>
                            </div>
                            <div class="notif-content ms-2 flex-grow-1">
                                <span class="block fw-bold">${n.mensaje}</span>
                                <span class="time d-block small text-muted">${new Date(n.fecha).toLocaleString()}</span>
                            </div>
                        </a>
                        <button onclick="eliminarNotificacion(${n.id_notificacion})" 
                            class="position-absolute top-0 end-0 border-0 bg-transparent p-1"
                            style="font-size: 12px; color: black;">
                            <i class="fa fa-times"></i>
                        </button>                
                    </div>
                `;
            });
        }

        // Mostrar solo la cantidad de notificaciones NO leídas
        const noLeidas = notificaciones.filter(n => !n.leida);
        document.querySelector(".notification").textContent = noLeidas.length;
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
    }
}


// ✅ Funciones globales para marcar como leída y eliminar notificación
window.marcarLeida = async function(id) {
    try {
        await fetch(`/api/notificaciones/${id}/leida`, { method: "PUT" });
        cargarNotificaciones();
    } catch (error) {
        console.error("Error al marcar como leída:", error);
    }
};

window.eliminarNotificacion = async function(id) {
    try {
        await fetch(`/api/notificaciones/${id}`, { method: "DELETE" });
        cargarNotificaciones();
    } catch (error) {
        console.error("Error al eliminar notificación:", error);
    }
};

// ✅ Iniciar carga de notificaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
    cargarNotificaciones();
    setInterval(cargarNotificaciones, 10000); // Actualizar cada 10 segundos
});




async function cargarLaboratorios() {
    try {
        const response = await fetch("http://localhost:3000/laboratorios");
        const laboratorios = await response.json();

        console.log("Laboratorios cargados:", laboratorios); // Verifica que los laboratorios se reciban correctamente

        let selectLaboratorios = document.getElementById("laboratorioSelect");
        selectLaboratorios.innerHTML = "<option disabled selected value=''>Selecciona un laboratorio</option>";

        laboratorios.forEach(lab => {
            let option = document.createElement("option");
            option.value = lab.id_laboratorio;
            option.textContent = lab.nombre_laboratorio;
            selectLaboratorios.appendChild(option);
        });

        // Detectar cambios
        selectLaboratorios.addEventListener("change", function () {
            let idLaboratorio = this.value;
            if (idLaboratorio) {
                cargarEquipos(idLaboratorio);
            } else {
                limpiarEquipos();
            }
        });

    } catch (error) {
        console.error("Error al obtener laboratorios:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    cargarLaboratorios(); 
});


async function cargarEquipos(idLaboratorio) {
    try {
        const response = await fetch(`http://localhost:3000/equipos/${idLaboratorio}`);
        const equipos = await response.json();


        let selectEquipos = document.getElementById("equipoSelect");
        selectEquipos.innerHTML = "<option disabled selected value=''>Selecciona un equipo</option>";

        equipos.forEach(equipo => {
            let option = document.createElement("option");
            option.value = equipo.id_equipo;

            option.textContent = equipo.numero_equipo || "Sin nombre";
            selectEquipos.appendChild(option);
        });

    } catch (error) {
        console.error("Error al obtener equipos:", error);
    }
}


// Función para limpiar equipos si no hay laboratorio seleccionado
function limpiarEquipos() {
    let selectEquipos = document.getElementById("equipoSelect");
    selectEquipos.innerHTML = "<option disabled selected value=''>Selecciona un equipo</option>";
}



document.getElementById("enviarReporte").addEventListener("click", async function () {
    // Obtener valores del formulario
    const id_equipo = document.getElementById("equipoSelect").value;
    const id_laboratorio = document.getElementById("laboratorioSelect").value;
    const descripcion = document.getElementById("descripcionProblema").value;
    
    // Obtener el usuario almacenado
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    const usuario = JSON.parse(storage.getItem("user"));

    if (!usuario) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se ha identificado el usuario.",
            confirmButtonText: "Ir al login"
        }).then(() => {
            window.location.href = "login.html"; // Redirigir si no hay usuario
        });
        return;
    }

    const id_usuario = usuario.id_usuario;

    if (descripcion.trim() === "") {
        Swal.fire({
            icon: "warning",
            title: "Campo vacío",
            text: "Por favor, describe el problema.",
            confirmButtonText: "Entendido"
        });
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/crearReporte", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario, id_equipo, id_laboratorio, descripcion })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "¡Reporte enviado!",
                text: "El reporte se ha enviado correctamente.",
                confirmButtonText: "Aceptar"
            }).then(() => {
                window.location.reload(); 
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Error al enviar",
                text: data.message,
                confirmButtonText: "Intentar de nuevo"
            });
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error en la conexión",
            text: "No se pudo conectar con el servidor.",
            confirmButtonText: "Aceptar"
        });
    }
});

