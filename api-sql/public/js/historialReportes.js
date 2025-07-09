document.addEventListener("DOMContentLoaded", function () {
    const contenedor = document.getElementById("historialReportes");
    const filtros = {
        fecha: document.getElementById("filterFecha"),
        usuario: document.getElementById("filterUsuario"),
        laboratorio: document.getElementById("filterLaboratorio"),
        nivel: document.getElementById("filterNivel"),
        estatus: document.getElementById("filterEstatus")
    };

    let todosReportes = [];

    async function obtenerHistorial() {
        try {
            const response = await fetch("http://localhost:3000/api/historialReportes");
            todosReportes = await response.json();
            renderizarHistorial(todosReportes);
            cargarFiltros(todosReportes);
        } catch (error) {
            console.error("❌ Error al cargar historial:", error);
        }
    }

    function obtenerClaseNivel(nivelNombre) {
        const mapa = {
            "1ro de Primaria": 1,
            "2do de Primaria": 2,
            "3ro de Primaria": 3,
            "4to de Primaria": 4,
            "5to de Primaria": 5,
            "6to de Primaria": 6,
            "1ro de Secundaria": 7,
            "2do de Secundaria": 8,
            "3ro de Secundaria": 9
        };
    
        const id = mapa[nivelNombre];
        return id ? `bg-custom-nivel-${id}` : "bg-secondary";
    }    

    function renderizarHistorial(reportes) {
        contenedor.innerHTML = "";

        if (!reportes.length) {
            contenedor.innerHTML = `<div class="text-muted text-center">No hay reportes registrados.</div>`;
            return;
        }

        const agrupadosPorFecha = {};

        reportes.forEach(rep => {
            const fechaStr = new Date(rep.fecha_hora).toLocaleDateString();
            if (!agrupadosPorFecha[fechaStr]) {
                agrupadosPorFecha[fechaStr] = [];
            }
            agrupadosPorFecha[fechaStr].push(rep);
        });

        for (const fecha in agrupadosPorFecha) {
            const contenedorFecha = document.createElement("div");
            contenedorFecha.classList.add("mb-4");

            contenedorFecha.innerHTML = `
                <h5 class="text-primary border-bottom pb-2 mb-3">
                    <i class="fas fa-calendar-alt me-2"></i> ${fecha}
                </h5>
            `;

            agrupadosPorFecha[fecha].forEach(reporte => {
                const hora = new Date(reporte.fecha_hora).toLocaleTimeString();
                const estatus = reporte.estatus || "Pendiente";
                const badgeColor = estatus === "Pendiente"
                    ? "secondary"
                    : estatus === "En proceso"
                        ? "warning text-dark"
                        : "success";

                const card = document.createElement("div");
                card.className = "card shadow-sm mb-3";
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="text-primary mb-1">
                                    <i class="fas fa-desktop me-1"></i> ${reporte.numero_equipo} - ${reporte.nombre_laboratorio}
                                </h6>
                                <span class="badge bg-dark me-1"><i class="fas fa-user me-1"></i> ${reporte.nombre || "Desconocido"}</span>
                                <span class="badge ${obtenerClaseNivel(reporte.nivel_usuario)} nivel-badge">
                                    <i class="fas fa-graduation-cap me-1"></i> ${reporte.nivel_usuario || "No asignado"}
                                </span>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${badgeColor} badge-estatus">${reporte.estatus}</span>
                            </div>
                        </div>

                        <div class="card-detalle card-descripcion">
                            <div class="titulo text-purple">Descripción:</div>
                            <div>${reporte.descripcion}</div>
                        </div>

                        <div class="card-detalle card-observacion ${!reporte.observaciones ? 'observacion-empty' : ''}">
                            <div class="titulo text-primary">Observaciones:</div>
                            <div>${reporte.observaciones || 'Sin observaciones'}</div>
                        </div>

                        <div class="text-muted mt-2">
                            <i class="far fa-clock me-1"></i> ${hora}
                        </div>
                    </div>
                `;


                contenedorFecha.appendChild(card);
            });

            contenedor.appendChild(contenedorFecha);
        }
    }

    document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
        filtros.fecha.value = "";
        filtros.usuario.value = "";
        filtros.laboratorio.value = "";
        filtros.nivel.value = "";
        filtros.estatus.value = "";
        aplicarFiltros(); // ✅ Esta sí existe
    });
    

    function cargarFiltros(reportes) {
        const usuarios = new Set();
        const laboratorios = new Set();
        const niveles = new Set();
        const estatuses = new Set();

        reportes.forEach(rep => {
            usuarios.add(rep.nombre || 'Desconocido');
            laboratorios.add(rep.nombre_laboratorio || 'Sin nombre');
            niveles.add(rep.nivel_usuario || 'No asignado');
            estatuses.add(rep.estatus || "Desconocido");
        });

        filtros.usuario.innerHTML = `<option value="">Todos</option>` +
            Array.from(usuarios).sort().map(u => `<option value="${u}">${u}</option>`).join("");

        filtros.laboratorio.innerHTML = `<option value="">Todos</option>` +
            Array.from(laboratorios).sort().map(l => `<option value="${l}">${l}</option>`).join("");

        filtros.nivel.innerHTML = `<option value="">Todos</option>` +
            Array.from(niveles).sort().map(n => `<option value="${n}">${n}</option>`).join("");

        filtros.estatus.innerHTML = `<option value="">Todos</option>` +
            Array.from(estatuses).map(e => `<option value="${e}">${e}</option>`).join("");
    }

    function aplicarFiltros() {
        const fecha = filtros.fecha.value;
        const usuario = filtros.usuario.value;
        const laboratorio = filtros.laboratorio.value;
        const nivel = filtros.nivel.value;
        const estatus = filtros.estatus.value;

        const filtrados = todosReportes.filter(rep => {
            const fechaReporte = new Date(rep.fecha_hora).toISOString().slice(0, 10); // YYYY-MM-DD
            const coincideFecha = !fecha || fecha === fechaReporte;
            const coincideUsuario = !usuario || rep.nombre === usuario;
            const coincideLab = !laboratorio || rep.nombre_laboratorio === laboratorio;
            const coincideNivel = !nivel || rep.nivel_usuario === nivel;
            const coincideEstatus = !estatus || rep.estatus === estatus;
            return coincideFecha && coincideUsuario && coincideLab && coincideNivel && coincideEstatus;

        });
        renderizarHistorial(filtrados);
    }

    async function cargarNotificaciones() {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        try {
            const res = await fetch(`http://localhost:3000/api/notificaciones/${user.id_usuario}`);
            const notificaciones = await res.json();

            const notifCount = document.getElementById("notifCount");
            const notifList = document.getElementById("notifList");

            notifCount.textContent = notificaciones.length;
            notifList.innerHTML = "";

            if (notificaciones.length === 0) {
                notifList.innerHTML = `<div class="text-muted text-center p-2">Sin notificaciones</div>`;
                return;
            }

            notificaciones.forEach(notif => {
                notifList.innerHTML += `
                <a href="#" class="d-block p-2 border-bottom" onclick="marcarLeida(${notif.id})">
                    <div class="notif-icon notif-primary"><i class="fa fa-info-circle"></i></div>
                    <div class="notif-content">
                        <span class="block">${notif.mensaje}</span>
                        <span class="time">${formatearTiempo(notif.fecha_hora)}</span>
                    </div>
                </a>
            `;
            });

        } catch (err) {
            console.error("❌ Error al cargar notificaciones:", err);
        }
    }

    function formatearTiempo(fecha) {
        const date = new Date(fecha);
        const ahora = new Date();
        const diff = Math.floor((ahora - date) / 60000); // en minutos

        if (diff < 1) return "Hace un momento";
        if (diff === 1) return "Hace 1 minuto";
        if (diff < 60) return `Hace ${diff} minutos`;
        return date.toLocaleString();
    }

    async function marcarLeida(id) {
        try {
            await fetch(`http://localhost:3000/api/notificaciones/${id}/leida`, { method: "PUT" });
            cargarNotificaciones(); // Refresca
        } catch (err) {
            console.error("❌ Error al marcar como leída:", err);
        }
    }

    async function cargarNotificaciones() {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`/api/notificaciones/${user.id_usuario}`);
        const notificaciones = await res.json();

        const notifBox = document.querySelector(".notif-center");
        notifBox.innerHTML = "";

        if (notificaciones.length === 0) {
            notifBox.innerHTML = `
            <div class="text-center text-muted small py-2">No hay notificaciones nuevas</div>
        `;
        } else {
            notificaciones.forEach(n => {
                notifBox.innerHTML += `
                <div class="d-flex justify-content-between align-items-start position-relative notification-item ${n.leida ? 'leida' : ''}" data-id="${n.id_notificacion}">
                    <a href="#" onclick="marcarLeida(${n.id_notificacion})" class="d-flex w-100 text-decoration-none text-dark">
                        <div class="notif-icon notif-primary"><i class="fa fa-bell"></i></div>
                        <div class="notif-content">
                            <span class="block">${n.mensaje}</span>
                            <span class="time">${new Date(n.fecha).toLocaleString()}</span>
                        </div>
                    </a>
                    <button onclick="eliminarNotificacion(${n.id_notificacion})" class="btn-close btn-close-white ms-2 position-absolute top-0 end-0" style="font-size: 0.6rem;" aria-label="Close"></button>
                </div>
            `;
            });
        }

        // Mostrar solo la cantidad de notificaciones NO leídas
        const noLeidas = notificaciones.filter(n => !n.leida);
        document.querySelector(".notification").textContent = noLeidas.length;
    }

    // ✅ Declarar funciones globales FUERA de cargarNotificaciones
    window.marcarLeida = async function (id) {
        await fetch(`/api/notificaciones/${id}/leida`, { method: "PUT" });
        cargarNotificaciones();
    };

    window.eliminarNotificacion = async function (id) {
        await fetch(`/api/notificaciones/${id}`, { method: "DELETE" });
        cargarNotificaciones();
    };

    Object.values(filtros).forEach(input => {
        input.addEventListener("change", aplicarFiltros);
    });

    
    cargarNotificaciones();
    setInterval(cargarNotificaciones, 10000); // actualiza cada 10 segundos
    obtenerHistorial();
});
