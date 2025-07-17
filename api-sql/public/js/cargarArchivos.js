document.addEventListener('DOMContentLoaded', function () {
    cargarArchivos();
});

async function cargarArchivos() {
    try {
        const response = await fetch("http://localhost:3000/api/archivos");
        const archivos = await response.json();
        const container = document.getElementById("contenedor-archivos");
        if (!container) return;

        container.innerHTML = "";

        archivos.forEach(archivo => {
            const estado = archivo.estado || 'Desconocido';
            let estadoBadgeClass = 'bg-secondary';

            if (estado === 'Pendiente') estadoBadgeClass = 'bg-warning text-dark';
            else if (estado === 'Procesado') estadoBadgeClass = 'bg-info';
            else if (estado === 'Aprobado') estadoBadgeClass = 'bg-success';

            container.innerHTML += `
                <div class="col-md-4">
  <div class="card mb-4 shadow-sm h-100 border-0">
    <div class="card-body d-flex flex-column justify-content-between">
      <div>
        <h6 class="text-truncate text-primary fw-bold mb-2" title="${archivo.nombre_archivo}">
          ${archivo.nombre_archivo}
        </h6>
        <p class="mb-1 small text-muted">
          <i class="fas fa-industry me-1"></i> ${archivo.unidad_negocio}
        </p>
        <p class="mb-1 small text-muted">
          <i class="fas fa-calendar-alt me-1"></i> ${new Date(archivo.fecha_subida).toLocaleDateString()}
        </p>
        <p class="mb-2 small">
          Estado: <span class="badge ${estadoBadgeClass}">${estado}</span>
        </p>
      </div>
      <a href="/ruta/para/descargar/${archivo.nombre_archivo}" class="btn btn-outline-primary btn-sm mt-auto">
        <i class="fas fa-download me-1"></i> Descargar
      </a>
    </div>
  </div>
</div>

            `;
        });

    } catch (error) {
        console.error("❌ Error al obtener archivos:", error);
        Swal.fire("Error", "No se pudieron cargar los archivos", "error");
    }
}
