// Obtener usuario logueado
document.addEventListener("DOMContentLoaded", () => {
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    const usuario = JSON.parse(storage.getItem("user"));

    // Verificar si el usuario existe
    if (!usuario) {
        console.error("No se encontró usuario en el almacenamiento.");
        // Redirigir a la página de login
        window.location.href = '/login.html';
    } else {
        console.log("Usuario cargado:", usuario);

        cargarLaboratorios(usuario.id_usuario);
    }
});

// Función async para cargar los laboratorios
async function cargarLaboratorios() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    console.log("Cargando laboratorios para el usuario", user.id_usuario); // Verificar si la función se llama correctamente

    try {
        const res = await fetch(`/api/laboratorios/${user.id_usuario}`);

        if (!res.ok) {  // Verificar si la respuesta es exitosa
            throw new Error(`Error en la respuesta: ${res.status} ${res.statusText}`);
        }

        const laboratorios = await res.json();

        console.log(laboratorios);  // Verificar si se reciben los datos correctamente

        const contenedor = document.getElementById("laboratorios");

        // Limpiar contenido previo
        contenedor.innerHTML = '';

        if (laboratorios.length === 0) {
            // Si no hay laboratorios asignados, mostrar mensaje
            contenedor.innerHTML = `<div class="col-12 text-center text-muted">No tienes laboratorios asignados.</div>`;
        } else {
            // Iterar sobre los laboratorios y agregar las cards
            laboratorios.forEach(laboratorio => {
                const card = `
                    <div class="col-12 col-md-6 col-lg-4 mb-3">
                        <div class="card laboratorio-card shadow-lg border-0">
                            <div class="card-header">
                                <h5 class="card-title">${laboratorio.nombre_laboratorio}</h5>
                            </div>
                            <div class="card-body">
                                <p class="card-text">Nivel: <strong>${laboratorio.nombre_nivel}</strong></p>
                                <p class="card-text">
                                    <i class="fas fa-cogs"></i> Reportes asociados: 
                                    <span class="badge bg-${laboratorio.total_reportes > 0 ? 'success' : 'secondary'}">
                                        ${laboratorio.total_reportes > 0 ? `${laboratorio.total_reportes} reportes` : 'No'}
                                    </span>
                                </p>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-primary w-100" onclick="mostrarReporte(${laboratorio.id_laboratorio})">
                                    Ver detalles
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.innerHTML += card;
            });


        }
    } catch (error) {
        console.error("Error al cargar laboratorios:", error);
    }
}

function mostrarReporte(id_laboratorio) {
    if (!id_laboratorio) {
        console.error("El valor de id_laboratorio es inválido.");
        return;
    }

    // Hacemos una petición para verificar si existe algún reporte para este id_laboratorio
    fetch(`/api/reporte/${id_laboratorio}`)
        .then(res => res.json())
        .then(data => {
            console.log("Datos recibidos del reporte:", data);
            console.log("Número de reportes encontrados:", data.length);

            if (Array.isArray(data) && data.length > 0) {
                console.log("✅ Se encontraron reportes:", data);

                // Limpiar el contenido anterior de la tabla
                const reporteTabla = document.getElementById('reporte-tabla');
                reporteTabla.innerHTML = '';

                // 🔹 Agregar cada reporte a la tabla
                data.forEach(reporte => {
                    const reporteFila = `
                        <tr>
                            <td>${reporte.id_reporte}</td>
                            <td>${new Date(reporte.fecha_hora).toLocaleString()}</td>
                            <td>${reporte.descripcion}</td>
                            <td>
                                <span class="badge bg-${reporte.estatus === 'Pendiente' ? 'danger' : 'success'}">
                                    ${reporte.estatus}
                                </span>
                            </td>
                        </tr>
                    `;
                    reporteTabla.innerHTML += reporteFila;
                });

                // Mostrar el modal
                $('#reporteModal').modal('show');
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin reportes',
                    text: 'Este laboratorio no tiene reportes asociados.',
                    showConfirmButton: true,
                    timer: 3000
                });
            }
        })



        .catch(error => {
            console.error("Error al obtener reporte:", error);
        });
}



// Función para mostrar los detalles del laboratorio
function verDetalles(nombreLaboratorio) {
    alert(`Detalles de: ${nombreLaboratorio}`);
}

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
window.marcarLeida = async function (id) {
    try {
        await fetch(`/api/notificaciones/${id}/leida`, { method: "PUT" });
        cargarNotificaciones();
    } catch (error) {
        console.error("Error al marcar como leída:", error);
    }
};

window.eliminarNotificacion = async function (id) {
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

