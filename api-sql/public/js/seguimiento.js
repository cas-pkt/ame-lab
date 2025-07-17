
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("http://localhost:3000/api/dashboard/kpis");
        const data = await res.json();

        document.getElementById("procesados").textContent = data.procesados;
        document.getElementById("enProceso").textContent = data.enProceso;
        document.getElementById("fallidos").textContent = data.fallidos;
        document.getElementById("totales").textContent = data.totales;

    } catch (err) {
        console.error("Error al cargar las tarjetas de resumen:", err);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("http://localhost:3000/api/reportes/recientes");
        const reportes = await res.json();

        const tbody = document.querySelector("#tablaReportes tbody");
        tbody.innerHTML = ""; // Limpia cualquier dato previo

        reportes.forEach((r, i) => {
            const fila = `
        <tr>
          <td>${i + 1}</td>
          <td>${r.nombre}</td>
          <td>${r.unidad_negocio || "N/A"}</td>
          <td>${r.nombre_usuario || "Desconocido"}</td>
          <td>${new Date(r.fecha_subida).toLocaleString()}</td>
          <td><span class="badge bg-${getColor(r.estado)}">${r.estado}</span></td>
        </tr>
      `;
            tbody.innerHTML += fila;
        });

    } catch (err) {
        console.error("Error al cargar la tabla de reportes:", err);
    }
});

// Función para asignar colores según estado
function getColor(estado) {
    switch (estado) {
        case "Procesado": return "success";
        case "En Proceso": return "warning text-dark";
        case "Fallido": return "danger";
        default: return "secondary";
    }
}
