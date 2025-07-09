document.addEventListener("DOMContentLoaded", async function () {
    let mapaLaboratorios = {}; // id_laboratorio => { nombre_laboratorio, nombre_nivel }

    async function cargarLaboratorios() {
        try {
            const res = await fetch("http://localhost:3000/api/laboratorios");
            const labs = await res.json();

            mapaLaboratorios = {};
            labs.forEach(lab => {
                mapaLaboratorios[lab.nombre_laboratorio] = {
                    id: lab.id_laboratorio,
                    nivel: lab.nombre_nivel
                };
            });

        } catch (err) {
            console.error("❌ Error al cargar laboratorios:", err);
        }
    }

    const checarModal = [
        "modalDetalleReporte",
        "tituloDetalleReporte",
        "detalleDescripcion",
        "detalleObservaciones",
        "detalleEstatus",
        "guardarDetalleCambios"
    ];

    const faltan = checarModal.filter(id => !document.getElementById(id));
    if (faltan.length) {
        console.error("❌ Faltan estos elementos del modal en el HTML:", faltan);
    }

    // Referencias a contenedores principales
    const tabs = document.getElementById("tabsLaboratorios");
    const contenido = document.getElementById("contenedorLaboratorios");

    // Filtros
    const filtroTexto = document.getElementById("filtroTexto");
    const filtroEstatus = document.getElementById("filtroEstatus");
    const filtroFecha = document.getElementById("filtroFecha");

    // Variable global para almacenar los reportes
    let todosLosReportes = [];

    // ✅ Función para obtener los datos desde el servidor
    async function cargarReportes() {
        try {
            const res = await fetch("http://localhost:3000/api/reportes");
            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            todosLosReportes = await res.json();

            cargarFiltrosSeguimiento(todosLosReportes);
            renderizarReportes();

        } catch (error) {
            console.error("❌ Error al cargar reportes:", error);
            document.getElementById("contenedorLaboratorios").innerHTML = `
                <div class="alert alert-danger text-center">No se pudieron cargar los reportes</div>
            `;
        }
    }

    // 🔄 Función principal para mostrar los reportes agrupados por laboratorio
    function renderizarReportes() {
        const texto = filtroTexto.value.trim().toLowerCase();
        const estatus = filtroEstatus.value;
        const fecha = filtroFecha.value;
        const usuario = document.getElementById("filtroUsuario").value;
        const laboratorio = document.getElementById("filtroLaboratorio").value;
        const nivel = document.getElementById("filtroNivel").value;

        const tabsPrimaria = document.getElementById("tabsPrimaria");
        const contenidoPrimaria = document.getElementById("contenidoTabsPrimaria");
        const tabsSecundaria = document.getElementById("tabsSecundaria");
        const contenidoSecundaria = document.getElementById("contenidoTabsSecundaria");

        if (!tabsPrimaria || !contenidoPrimaria || !tabsSecundaria || !contenidoSecundaria) {
            console.error("❌ No se encontraron los contenedores de pestañas por nivel");
            return;
        }

        // Limpiar contenido
        tabsPrimaria.innerHTML = "";
        contenidoPrimaria.innerHTML = "";
        tabsSecundaria.innerHTML = "";
        contenidoSecundaria.innerHTML = "";

        // Agrupar reportes por laboratorio
        const laboratoriosConReportes = {};
        todosLosReportes.forEach(reporte => {
            if (
                (texto && !(
                    reporte.nombre_usuario?.toLowerCase().includes(texto) ||
                    reporte.numero_equipo?.toLowerCase().includes(texto) ||
                    reporte.descripcion?.toLowerCase().includes(texto)
                )) ||
                (fecha && !reporte.fecha_hora.startsWith(fecha)) ||
                (usuario && reporte.nombre_usuario !== usuario) ||
                (laboratorio && reporte.nombre_laboratorio !== laboratorio) ||
                (nivel && reporte.nivel_usuario !== nivel) ||
                (estatus && reporte.estatus !== estatus)
            ) return;

            if (!laboratoriosConReportes[reporte.nombre_laboratorio]) {
                laboratoriosConReportes[reporte.nombre_laboratorio] = [];
            }
            laboratoriosConReportes[reporte.nombre_laboratorio].push(reporte);
        });

        // Crear estructura de TODOS los laboratorios (con y sin reportes)
        const primariaLabs = [];
        const secundariaLabs = [];

        Object.entries(mapaLaboratorios).forEach(([nombreLab, info]) => {
            const reportes = laboratoriosConReportes[nombreLab] || [];

            const labObj = {
                nombre: nombreLab,
                nivel: info.nivel,
                reportes
            };

            if (info.nivel.toLowerCase().includes("primaria")) {
                primariaLabs.push(labObj);
            } else if (info.nivel.toLowerCase().includes("secundaria")) {
                secundariaLabs.push(labObj);
            }
        });

        renderTabsReportes(primariaLabs, tabsPrimaria, contenidoPrimaria, "Primaria");
        renderTabsReportes(secundariaLabs, tabsSecundaria, contenidoSecundaria, "Secundaria");
    }

    function renderTabsReportes(labs, tabsContainer, contentContainer, nivelNombre) {
        labs.sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar alfabéticamente

        labs.forEach((lab, index) => {
            const tabId = `lab-${nivelNombre}-${index}`;

            // Crear tab
            const tab = document.createElement("li");
            tab.className = "nav-item";
            tab.innerHTML = `
                <button class="nav-link ${index === 0 ? "active" : ""}" 
                    id="${tabId}-tab"
                    data-bs-toggle="pill" 
                    data-bs-target="#${tabId}" 
                    type="button" 
                    role="tab">
                    ${lab.nombre}
                </button>`;
            tabsContainer.appendChild(tab);

            // Crear contenido
            const tabContent = document.createElement("div");
            tabContent.className = `tab-pane fade ${index === 0 ? "show active" : ""}`;
            tabContent.id = tabId;
            tabContent.role = "tabpanel";

            const row = document.createElement("div");
            row.className = "row";

            if (lab.reportes.length === 0) {
                row.innerHTML = `<div class="col-12 text-center text-muted py-3">No hay reportes en este laboratorio</div>`;
            } else {
                lab.reportes
                    .sort((a, b) => a.numero_equipo.localeCompare(b.numero_equipo))
                    .forEach(reporte => {
                        const badge = reporte.estatus === "Pendiente" ? "bg-secondary" :
                            reporte.estatus === "En proceso" ? "bg-warning text-dark" :
                                "bg-success text-white";

                        const card = document.createElement("div");
                        card.className = "col-md-6 col-lg-4 mb-4";
                        card.innerHTML = `
                        <div class="card shadow-sm border-start border-4 border-primary h-100">
                            <div class="card-body text-center">
                            <div class="text-center mb-3">
                                <img src="../styles/assets/img/computer-icon.png" alt="Equipo de Cómputo" style="width: 80px; height: 80px; margin-bottom: 10px;" />
                            </div>
                            <h5 class="card-title mb-1 fw-bold">${reporte.numero_equipo}</h5>
                                <h6 class="card-subtitle text-muted mb-2">${reporte.nombre_laboratorio}</h6>
                                <p class="mb-1"><strong>Usuario:</strong> ${reporte.nombre_usuario}</p>
                                <p class="mb-1"><strong>Descripción:</strong> ${reporte.descripcion}</p>
                                <p class="mb-1"><strong>Fecha:</strong> ${new Date(reporte.fecha_hora).toLocaleString()}</p>
                                <p class="mb-2"><strong>Estatus:</strong> <span class="badge ${badge}">${reporte.estatus}</span></p>
                                <button class="btn btn-sm btn-primary" onclick="verDetalleReporte(${reporte.id_reporte})">
                                    <i class="fas fa-eye me-1"></i> Detalles
                                </button>
                            </div>
                        </div>`;
                        row.appendChild(card);
                    });
            }

            tabContent.appendChild(row);
            contentContainer.appendChild(tabContent);
        });

        // 🔍 Consola para ver pestañas
        console.log(`📘 Tabs ${nivelNombre}:`);
        [...tabsContainer.querySelectorAll("button")].forEach(btn => {
            console.log(" -", btn.textContent.trim());
        });
    }

    document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
        document.getElementById("filtroTexto").value = "";
        document.getElementById("filtroEstatus").value = "";
        document.getElementById("filtroFecha").value = "";
        renderizarReportes();
    });

    filtroTexto.addEventListener("input", renderizarReportes);
    filtroEstatus.addEventListener("change", renderizarReportes);
    filtroFecha.addEventListener("change", renderizarReportes);

    function cargarFiltrosSeguimiento(reportes) {
        const usuarios = new Set();
        const laboratorios = new Set();
        const niveles = new Set();
        const estatuses = new Set();

        reportes.forEach(rep => {
            usuarios.add(rep.nombre_usuario || "Desconocido");
            laboratorios.add(rep.nombre_laboratorio || "Sin nombre");
            niveles.add(rep.nivel_usuario || "Sin nivel");
            estatuses.add(rep.estatus || "Desconocido");
        });

        // Función para generar opciones
        const generarOpciones = (set) =>
            `<option value="">Todos</option>` + Array.from(set).sort().map(x => `<option value="${x}">${x}</option>`).join("");

        document.getElementById("filtroUsuario").innerHTML = generarOpciones(usuarios);
        document.getElementById("filtroLaboratorio").innerHTML = generarOpciones(laboratorios);
        document.getElementById("filtroNivel").innerHTML = generarOpciones(niveles);
        document.getElementById("filtroEstatus").innerHTML = generarOpciones(estatuses);

    }

    function agregarEventosGuardar() {
        const botonesGuardar = document.querySelectorAll(".guardar-btn");

        botonesGuardar.forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.dataset.id;

                const estatus = document.querySelector(`.estatus-select[data-id="${id}"]`).value;
                const observaciones = document.querySelector(`.observaciones-text[data-id="${id}"]`).value;

                const res = await fetch(`/api/reportes/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estatus, observaciones })
                });

                const data = await res.json();

                if (res.ok) {
                    Swal.fire("✅ Guardado", data.message, "success");
                    cargarReportes();
                } else {
                    Swal.fire("❌ Error", data.message, "error");
                }
            });
        });
    }

    window.verDetalleReporte = async function (idReporte) {
        try {
            const res = await fetch(`http://localhost:3000/api/reportes/${idReporte}`);
            if (!res.ok) throw new Error("No se pudo obtener el reporte");

            const reporte = await res.json();

            const titulo = document.getElementById("tituloDetalleReporte");
            const desc = document.getElementById("detalleDescripcion");
            const obs = document.getElementById("detalleObservaciones");
            const estatus = document.getElementById("detalleEstatus");
            const btnGuardar = document.getElementById("guardarDetalleCambios");
            const btnEliminar = document.getElementById("eliminarReporte");

            if (!titulo || !desc || !obs || !estatus || !btnGuardar) {
                console.error("❌ Faltan elementos del modal en el HTML");
                return;
            }

            // Mostrar los datos
            titulo.textContent = `#${reporte.id_reporte}`;
            desc.textContent = reporte.descripcion || "-";
            obs.value = reporte.observaciones || "";
            estatus.value = reporte.estatus;

            // Si el reporte está resuelto, bloquear campos
            const estaResuelto = reporte.estatus === "Resuelto";
            obs.disabled = estaResuelto;
            estatus.disabled = estaResuelto;
            btnGuardar.style.display = estaResuelto ? "none" : "inline-block";

            btnEliminar.onclick = async () => {
                Swal.fire({
                    title: "¿Eliminar reporte?",
                    text: "Esta acción no se puede deshacer",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const res = await fetch(`http://localhost:3000/api/reportes/${idReporte}`, {
                                method: "DELETE"
                            });
                            let result;
                            try {
                                result = await res.json();
                            } catch (jsonError) {
                                console.error("❌ La respuesta no es JSON:", jsonError);
                                Swal.fire("❌ Error", "La respuesta del servidor no es válida", "error");
                                return;
                            }


                            if (res.ok) {
                                Swal.fire("✅ Eliminado", result.message || "Reporte eliminado correctamente", "success").then(() => {
                                    const modalElement = document.getElementById("modalDetalleReporte");
                                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                                    modalInstance.hide();
                                    cargarReportes(); // refrescar la lista
                                });
                            } else {
                                throw new Error(result.message || "No se pudo eliminar el reporte");
                            }
                        } catch (err) {
                            console.error("❌ Error al eliminar:", err);
                            Swal.fire("❌ Error", err.message, "error");
                        }
                    }
                });
            };

            // Guardar cambios
            btnGuardar.onclick = async () => {
                console.log("🟢 Se hizo clic en 'Guardar cambios'");

                const nuevasObservaciones = obs.value;
                const nuevoEstatus = estatus.value;

                console.log("📤 Datos a enviar:", {
                    id: idReporte,
                    estatus: nuevoEstatus,
                    observaciones: nuevasObservaciones
                });

                try {
                    const updateRes = await fetch(`http://localhost:3000/api/reportes/${idReporte}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            estatus: nuevoEstatus,
                            observaciones: nuevasObservaciones,
                        }),
                    });

                    const result = await updateRes.json();
                    console.log("📥 Respuesta del servidor:", result); // <-- Agrega esto por ahora
                    if (!updateRes.ok) throw new Error(result.message);

                    console.log("✅ Todo bien, mostrando Swal...");
                    Swal.fire({
                        icon: "success",
                        title: "Guardado correctamente",
                        text: result.message,
                        confirmButtonText: "OK"
                    }).then(() => {
                        const modalElement = document.getElementById("modalDetalleReporte");
                        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                        modalInstance.hide();
                        location.reload();
                    });

                } catch (err) {
                    console.error("❌ Error en el PUT:", err); // 👈 Agrega esto
                    Swal.fire("❌ Error", err.message, "error");
                }
            };

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById("modalDetalleReporte"));
            modal.show();

        } catch (err) {
            console.error("❌ Error al mostrar detalle:", err);
            Swal.fire("❌ Error", "No se pudo cargar el detalle del reporte", "error");
        }
    };

    window.verDetalle = window.verDetalleReporte;

    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("guardar-reporte")) {
            const li = e.target.closest("li");
            const id = li?.dataset?.id;
            const estatus = li.querySelector(".estatus-reporte")?.value;
            const observaciones = li.querySelector(".observaciones-reporte")?.value;

            if (!id || !estatus) {
                Swal.fire("Error", "Faltan datos para guardar", "error");
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/reportes/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estatus, observaciones })
                });

                const result = await response.json();

                if (response.ok) {
                    Swal.fire("✅ Cambios guardados", result.message, "success");
                } else {
                    Swal.fire("❌ Error", result.message, "error");
                }
            } catch (err) {
                console.error("Error al actualizar reporte:", err);
                Swal.fire("❌ Error", "No se pudo guardar el cambio", "error");
            }
        }
    });

    async function cargarNotificaciones() {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user || !user.id_usuario) throw new Error("Usuario no válido");

            const response = await fetch(`/api/notificaciones/${user.id_usuario}`);
            if (!response.ok) throw new Error("Error al obtener notificaciones");

            const notificaciones = await response.json();
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
            // Mostrar la cantidad de no leídas
            const noLeidas = notificaciones.filter(n => !n.leida);
            document.querySelector(".notification").textContent = noLeidas.length;

        } catch (error) {
            console.error("❌ Error al cargar notificaciones:", error);
        }
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

    await cargarLaboratorios();
    await cargarReportes(); // Cargar reportes al inicio
    agregarEventosGuardar();
    cargarNotificaciones();
    setInterval(cargarNotificaciones, 10000); // actualiza cada 10 segundos
});