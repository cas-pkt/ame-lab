document.addEventListener("DOMContentLoaded", async function () {
    const tableBody = document.querySelector("#basic-datatables tbody");

    // Obtener usuario logueado
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    const usuario = JSON.parse(storage.getItem("user"));

    if (!usuario) {
        setTimeout(() => { window.location.href = "login.html"; },);
        return;
    }

    const id_usuario = usuario.id_usuario;

    try {
        const response = await fetch(`http://localhost:3000/reportes/${id_usuario}`);
        const reportes = await response.json();

        tableBody.innerHTML = ""; // Limpiar tabla

        if (reportes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">No tienes reportes registrados</td>
                </tr>
            `;
            return;
        }

        reportes.forEach(reporte => {
            let row = document.createElement("tr");

            row.innerHTML = `
                <td>${reporte.id_reporte}</td>
                <td>${reporte.numero_equipo}</td>
                <td>${reporte.nombre_laboratorio}</td>
                <td>${new Date(reporte.fecha_hora).toLocaleString()}</td>
                <td>
                    <button class="btn btn-info btn-sm ver-detalle" 
                        data-bs-toggle="modal" 
                        data-bs-target="#miModal"
                        data-descripcion="${reporte.descripcion}"
                        data-observaciones="${reporte.observaciones || 'No hay observaciones aún.'}">
                        📄 Ver
                    </button>
                </td>
                <td>
                    <span class="badge bg-${reporte.estatus === 'Pendiente' ? 'danger' : 'success'}">
                        ${reporte.estatus}
                    </span>
                </td>
            `;

            tableBody.appendChild(row);
        });

        $(document).ready(function () {
            $("#basic-datatables").DataTable({
                "pageLength": 5,     
                "lengthChange": false, 
                "language": {
                    "paginate": { "previous": "←", "next": "→" },
                    "info": "Página _PAGE_ de _PAGES_",
                    "search": "Buscar:"
                }
            });
        });

        // Mostrar descripción en el modal
        document.querySelectorAll(".ver-detalle").forEach(button => {
            button.addEventListener("click", function () {
                document.querySelector("#descripcionProblema").textContent = this.getAttribute("data-descripcion");
            });
        });
        // Mostrar observaciones en el modal
        document.querySelectorAll(".ver-detalle").forEach(button => {
            button.addEventListener("click", function () {
                document.querySelector("#observacionesProblema").textContent = this.getAttribute("data-observaciones");
            });
        });

    } catch (error) {
        console.error("Error al cargar reportes:", error);
        Swal.fire("Error", "No se pudieron cargar los reportes", "error");
    }
});

async function cargarNotificaciones() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res = await fetch(`/api/notificaciones/${user.id_usuario}`);
        const notificaciones = await res.json();

        const notifBox = document.querySelector(".notif-center");
        notifBox.innerHTML = `
            <!-- Botón elegante de "Marcar todas como leídas" -->
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

// ✅ Declarar funciones globales FUERA de cargarNotificaciones
window.marcarLeida = async function(id) {
    await fetch(`/api/notificaciones/${id}/leida`, { method: "PUT" });
    cargarNotificaciones();
};

window.eliminarNotificacion = async function(id) {
    await fetch(`/api/notificaciones/${id}`, { method: "DELETE" });
    cargarNotificaciones();
};

async function marcarTodasLeidas() {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/api/notificaciones/marcar-todas/${user.id_usuario}`, { method: "PUT" });

    cargarNotificaciones();
}



cargarNotificaciones();
setInterval(cargarNotificaciones, 10000); // actualiza cada 10 segundos