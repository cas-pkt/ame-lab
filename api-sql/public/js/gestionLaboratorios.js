document.addEventListener("DOMContentLoaded", async function () {
    const formLaboratorio = document.getElementById("formAgregarLaboratorio");
    const btnAgregarLaboratorio = document.getElementById("btnAgregarLaboratorio");
    const tabsPrimaria = document.getElementById("laboratorioTabsPrimaria");
    const contentPrimaria = document.getElementById("laboratorioContentPrimaria");
    const tabsSecundaria = document.getElementById("laboratorioTabsSecundaria");
    const contentSecundaria = document.getElementById("laboratorioContentSecundaria");

    if (!formLaboratorio || !btnAgregarLaboratorio || !tabsPrimaria || !contentPrimaria || !tabsSecundaria || !contentSecundaria) {
        console.error("❌ Elementos no encontrados en el DOM.");
        return;
    }

    async function cargarLaboratorios() {
        const response = await fetch("http://localhost:3000/api/laboratorios");
        const laboratorios = await response.json();

        const tabsPrimaria = document.getElementById("laboratorioTabsPrimaria");
        const contentPrimaria = document.getElementById("laboratorioContentPrimaria");
        const tabsSecundaria = document.getElementById("laboratorioTabsSecundaria");
        const contentSecundaria = document.getElementById("laboratorioContentSecundaria");

        // Limpiar contenedores
        tabsPrimaria.innerHTML = "";
        contentPrimaria.innerHTML = "";
        tabsSecundaria.innerHTML = "";
        contentSecundaria.innerHTML = "";

        console.log("Laboratorios cargados:", laboratorios);

        // Ordenar laboratorios por nombre alfabéticamente
        laboratorios.sort((a, b) => a.nombre_laboratorio.localeCompare(b.nombre_laboratorio));

        // Asegurar que se asignen correctamente a Primaria y Secundaria
        const primaria = laboratorios.filter(l => /primaria/i.test(l.nombre_nivel));
        const secundaria = laboratorios.filter(l => /secundaria/i.test(l.nombre_nivel));


        function renderTabs(labs, tabsContainer, contentContainer, prefix) {
            labs.forEach((lab, i) => {
                tabsContainer.innerHTML += `
                    <li class="nav-item">
                        <button class="nav-link ${i === 0 ? 'active' : ''}" 
                            data-id="${lab.id_laboratorio}" 
                            data-nombre="${lab.nombre_laboratorio}" 
                            data-bs-toggle="tab" 
                            data-bs-target="#${prefix}-${lab.id_laboratorio}">
                            ${lab.nombre_laboratorio}
                        </button>
                    </li>`;

                contentContainer.innerHTML += `
                    <div class="tab-pane fade ${i === 0 ? 'show active' : ''}" 
                        id="${prefix}-${lab.id_laboratorio}">
                        <div class="row p-3" id="equipos-lab-${lab.id_laboratorio}"></div>
                    </div>`;

                cargarEquipos(lab.id_laboratorio); // Carga equipos por laboratorio
            });
        }

        renderTabs(primaria, tabsPrimaria, contentPrimaria, "primaria");
        renderTabs(secundaria, tabsSecundaria, contentSecundaria, "secundaria");
    }

    document.addEventListener("contextmenu", function (e) {
        if (e.target.matches(".nav-link[data-id]")) {
            e.preventDefault();

            const btn = e.target;
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;

            // 🔥 Agrega la clase .shake y quítala después
            btn.classList.add("shake");
            setTimeout(() => btn.classList.remove("shake"), 500);

            Swal.fire({
                title: `¿Eliminar "${nombre}"?`,
                text: "Esta acción no se puede deshacer",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#e3342f",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`http://localhost:3000/api/laboratorios/${id}`, {
                            method: "DELETE"
                        });

                        const data = await res.json();

                        if (res.ok) {
                            Swal.fire("Eliminado", data.message || "Laboratorio eliminado", "success");
                            cargarLaboratorios();
                        } else {
                            Swal.fire("Error", data.message || "No se pudo eliminar", "error");
                        }
                    } catch (err) {
                        console.error(err);
                        Swal.fire("Error", "Error al conectar con el servidor", "error");
                    }
                }
            });
        }
    });

    async function cargarEquipos(idLaboratorio) {
        try {
            const response = await fetch(`http://localhost:3000/api/laboratorios/${idLaboratorio}/equipos`);
            const equipos = await response.json();
            const container = document.getElementById(`equipos-lab-${idLaboratorio}`);
            if (!container) return;

            container.innerHTML = "";

            // Ordenar equipos por número_equipo
            equipos.sort((a, b) => a.numero_equipo.localeCompare(b.numero_equipo, undefined, { numeric: true }));

            equipos.forEach(equipo => {
                const estado = equipo.estado || 'Desconocido';
                let estadoBadgeClass = 'bg-secondary';

                if (estado === 'Pendiente') estadoBadgeClass = 'bg-warning text-dark';
                else if (estado === 'En proceso') estadoBadgeClass = 'bg-primary';
                else if (estado === 'Resuelto') estadoBadgeClass = 'bg-success';

                container.innerHTML += `
                    <div class="col-md-4">
                        <div class="card mb-3 shadow-sm">
                            <div class="card-body text-center">
                            <img src="../styles/assets/img/computer-icon.png" alt="Equipo de Cómputo" style="width: 80px; height: 80px; margin-bottom: 10px;" />
                                <h5 class="card-title">${equipo.numero_equipo}</h5>
                                <p class="card-text">
                                    Estado: <span class="badge ${estadoBadgeClass}">${estado}</span>
                                </p>
                                <button class="btn btn-info btn-sm btnVerEquipo me-2" data-id="${equipo.id_equipo}">
                                    Ver Reportes
                                </button>
                                <button class="btn btn-warning btn-sm btnEditarEquipo" 
                                    data-id="${equipo.id_equipo}" 
                                    data-numero="${equipo.numero_equipo}">
                                    Editar Equipo
                                </button>
                            </div>
                        </div>
                    </div>`;
            });

        } catch (error) {
            console.error(`❌ Error al obtener equipos del laboratorio ${idLaboratorio}:`, error);
            Swal.fire("Error", "No se pudieron cargar los equipos", "error");
        }
    }

    window.verEquipo = async function (idEquipo) {
        if (!idEquipo || isNaN(idEquipo)) {
            console.error("❌ ID de equipo no válido:", idEquipo);
            return Swal.fire("Error", "ID de equipo no válido", "error");
        }
        try {

            const response = await fetch(`http://localhost:3000/api/reportesPorEquipo/${idEquipo}`);
            const reportes = await response.json();
            console.log("📦 Datos recibidos del servidor:", reportes);

            const lista = document.getElementById("listaReportesEquipo");
            const titulo = document.getElementById("modalEquipoTitulo");

            titulo.textContent = `#${idEquipo}`;
            lista.innerHTML = "";

            if (!Array.isArray(reportes) || reportes.length === 0) {
                lista.innerHTML = `<li class="list-group-item text-muted">Este equipo no tiene reportes.</li>`;
            } else {
                reportes.forEach(reporte => {
                    const li = document.createElement("li");
                    li.className = "list-group-item bg-light position-relative rounded mb-3 p-3";

                    // Badge del estatus (esquina superior derecha)
                    const estatusBadge = reporte.estatus === "Resuelto"
                        ? `<span class="badge bg-success position-absolute top-0 end-0 m-2">Resuelto</span>`
                        : reporte.estatus === "En proceso"
                            ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2">En proceso</span>`
                            : `<span class="badge bg-primary position-absolute top-0 end-0 m-2">Pendiente</span>`;

                    // Badge de usuario
                    const usuarioBadge = `
                        <span class="badge bg-secondary me-2">
                            <i class="fas fa-user me-1"></i>${reporte.nombre_usuario || "Desconocido"}
                        </span>`;

                    // Badge de nivel
                    const nivelBadge = `
                        <span class="badge bg-info text-dark">
                            <i class="fas fa-graduation-cap me-1"></i>${reporte.nombre_nivel || "Sin nivel"}
                        </span>`;

                    li.innerHTML = `
                        ${estatusBadge}
                        <div class="d-flex flex-column">
                            <div class="fw-bold text-primary mb-2" style="font-size: 1.05rem;">
                                <i class="fas fa-comment-dots me-2"></i>${reporte.descripcion}
                            </div>
                            <div class="mb-2">
                                ${usuarioBadge}
                                ${nivelBadge}
                            </div>
                            <small class="text-muted">
                                <i class="far fa-clock me-1"></i>${new Date(reporte.fecha_hora).toLocaleString()}
                            </small>
                        </div>
                    `;
                    lista.appendChild(li);
                });
            }

            const modal = new bootstrap.Modal(document.getElementById("modalReportesEquipo"));
            modal.show();

        } catch (error) {
            console.error("❌ Error al obtener reportes del equipo:", error);
            Swal.fire("Error", "No se pudieron cargar los reportes del equipo", "error");
        }
    };

    document.getElementById("btnAgregarLaboratorio").addEventListener("click", async () => {
        const selectNivel = document.getElementById("nivelLaboratorio");
        selectNivel.innerHTML = `<option value="">Seleccione</option>`; // Limpiar y agregar placeholder

        try {
            const res = await fetch("http://localhost:3000/api/niveles");
            const niveles = await res.json();

            niveles.forEach(nivel => {
                const option = document.createElement("option");
                option.value = nivel.id_nivel;
                option.textContent = nivel.nombre_nivel;
                selectNivel.appendChild(option);
            });

            const modal = new bootstrap.Modal(document.getElementById("modalAgregarLaboratorio"));
            modal.show();
        } catch (error) {
            console.error("❌ Error al cargar niveles:", error);
            Swal.fire("Error", "No se pudieron cargar los niveles. Intenta de nuevo.", "error");
        }
    });


    document.getElementById("formAgregarLaboratorio").addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nombreLaboratorio").value.trim();
        const nivel = document.getElementById("nivelLaboratorio").value;

        if (!nombre || !nivel) {
            return Swal.fire("⚠️ Faltan datos", "Por favor completa todos los campos", "warning");
        }

        const res = await fetch("http://localhost:3000/api/laboratorios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre_laboratorio: nombre, id_nivel: parseInt(nivel) })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire(" Éxito", "Laboratorio agregado correctamente", "success");
            bootstrap.Modal.getInstance(document.getElementById("modalAgregarLaboratorio")).hide();
            document.getElementById("formAgregarLaboratorio").reset(); // Solo se limpia aquí
            cargarLaboratorios();
        } else {
            Swal.fire({
                icon: "error",
                title: "❌ Error al agregar laboratorio",
                text: data.message || "Ocurrió un problema al intentar agregar el laboratorio. Intenta nuevamente.",
                confirmButtonText: "OK"
            });
        }
    });

    document.getElementById("formAgregarEquipo").addEventListener("submit", async function (e) {
        e.preventDefault();
        const numeroEquipo = document.getElementById("numeroEquipo").value.trim();
        const id_laboratorio = document.getElementById("laboratorioEquipo").value;

        const response = await fetch("http://localhost:3000/api/equipos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numero_equipo: numeroEquipo, id_laboratorio })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire(" Éxito", "Equipo agregado correctamente", "success");
            document.getElementById("formAgregarEquipo").reset();
            bootstrap.Modal.getInstance(document.getElementById("modalAgregarEquipo")).hide();
            cargarLaboratorios(); // Recargar vista
        } else {
            Swal.fire("❌ Error", data.message || "No se pudo agregar", "error");
        }
    });

    document.getElementById("formEditarEquipo").addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.getElementById("editarIdEquipo").value;
        const nuevoNombre = document.getElementById("editarNumeroEquipo").value.trim();
        const nuevoLaboratorio = document.getElementById("editarLaboratorioEquipo").value;

        if (!nuevoNombre || !nuevoLaboratorio) {
            return Swal.fire("⚠️", "Todos los campos son obligatorios", "warning");
        }

        try {
            const response = await fetch(`http://localhost:3000/api/equipos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numero_equipo: nuevoNombre, id_laboratorio: nuevoLaboratorio })
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire(" Éxito", result.message, "success");
                bootstrap.Modal.getInstance(document.getElementById("modalEditarEquipo")).hide();
                cargarLaboratorios();
            } else {
                Swal.fire("❌ Error", result.message || "No se pudo actualizar", "error");
            }
        } catch (err) {
            Swal.fire("❌ Error", "Error al conectar con el servidor", "error");
        }
    });

    const btnAgregarEquipo = document.getElementById("btnAgregarEquipo");
    if (btnAgregarEquipo) {
        btnAgregarEquipo.addEventListener("click", async () => {

            const select = document.getElementById("laboratorioEquipo");
            if (!select) {
                console.error("❌ No se encontró el select #laboratorioEquipo");
                return;
            }

            select.innerHTML = "";

            try {
                const res = await fetch("http://localhost:3000/api/laboratorios");
                const laboratorios = await res.json();

                laboratorios.forEach(lab => {
                    const option = document.createElement("option");
                    option.value = lab.id_laboratorio;
                    option.textContent = lab.nombre_laboratorio;
                    select.appendChild(option);
                });

                const modalElement = document.getElementById("modalAgregarEquipo");
                if (!modalElement) {
                    console.error("❌ No se encontró el modal #modalAgregarEquipo");
                    return;
                }

                const modal = new bootstrap.Modal(modalElement);
                modal.show();

            } catch (err) {
                console.error("❌ Error al obtener laboratorios:", err);
                Swal.fire("Error", "No se pudieron cargar los laboratorios", "error");
            }
        });
    } else {
        console.error("❌ No se encontró el botón #btnAgregarEquipo en el DOM.");
    }

    document.getElementById("btnEliminarEquipo").addEventListener("click", async function () {
        const id = document.getElementById("editarIdEquipo").value;

        const confirmar = await Swal.fire({
            title: "¿Eliminar equipo?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (confirmar.isConfirmed) {
            try {
                const res = await fetch(`http://localhost:3000/api/equipos/${id}`, {
                    method: "DELETE"
                });

                const data = await res.json();
                if (res.ok) {
                    Swal.fire(" Eliminado", data.message || "Equipo eliminado", "success");
                    bootstrap.Modal.getInstance(document.getElementById("modalEditarEquipo")).hide();
                    cargarLaboratorios();
                } else {
                    Swal.fire("❌ Error", data.message || "No se pudo eliminar", "error");
                }
            } catch (err) {
                Swal.fire("❌ Error", "Error al conectar con el servidor", "error");
            }
        }
    });

    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("btnVerEquipo")) {
            const idEquipo = e.target.dataset.id;
            verEquipo(idEquipo);
        }
    });

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

    document.addEventListener("click", async function (e) {
        if (e.target.classList.contains("btnEditarEquipo")) {
            const idEquipo = e.target.dataset.id;
            const numeroActual = e.target.dataset.numero;

            // Obtener laboratorio actual del equipo
            const resEquipo = await fetch(`http://localhost:3000/api/equipos/${idEquipo}`);
            const equipoData = await resEquipo.json();
            const labActual = equipoData.id_laboratorio;

            // Llenar el select con laboratorios
            const select = document.getElementById("editarLaboratorioEquipo");
            select.innerHTML = "";

            const res = await fetch("http://localhost:3000/api/laboratorios");
            const laboratorios = await res.json();

            laboratorios.forEach(lab => {
                const option = document.createElement("option");
                option.value = lab.id_laboratorio;
                option.textContent = lab.nombre_laboratorio;
                if (lab.id_laboratorio === labActual) option.selected = true;
                select.appendChild(option);
            });

            // Rellenar campos
            document.getElementById("editarIdEquipo").value = idEquipo;
            document.getElementById("editarNumeroEquipo").value = numeroActual;

            const modal = new bootstrap.Modal(document.getElementById("modalEditarEquipo"));
            modal.show();
        }
    });

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


    cargarNotificaciones();
    setInterval(cargarNotificaciones, 10000); // actualiza cada 10 segundos
    cargarLaboratorios();
});
