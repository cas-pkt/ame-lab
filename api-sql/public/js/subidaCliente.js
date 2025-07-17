document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formAgregarArchivo');
    const btnModal = document.getElementById('btnAgregarArchivo');
    const modalElement = document.getElementById('modalAgregarArchivo');

    // Mostrar modal al hacer clic en el botón
    btnModal.addEventListener('click', function () {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    });

    // Envío del formulario
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        // Validación del campo unidad_negocio y archivo
        const unidadNegocio = formData.get('unidad_negocio')?.trim();
        const archivo = formData.get('archivo');

        if (!unidadNegocio || !archivo || archivo.size === 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Faltan campos',
                text: 'Por favor completa todos los campos antes de continuar.'
            });
        }

        // Obtener ID del usuario desde sessionStorage
        console.log("sessionStorage:", sessionStorage.getItem("user"));
        console.log("localStorage:", localStorage.getItem("user"));

        // ✅ Obtener el usuario desde sessionStorage
        let userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
        if (!userRaw) {
            Swal.fire({
                icon: 'error',
                title: 'Sesión no iniciada',
                text: 'No se encontró información del usuario. Por favor inicia sesión.'
            });
            return;
        }

        const usuario = JSON.parse(userRaw);
        formData.append('id_usuario', usuario.id_usuario);

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Archivo subido',
                    text: result.message
                });

                form.reset();
                const modalInstance = bootstrap.Modal.getInstance(modalAgregarArchivo);
                if (modalInstance) modalInstance.hide();

        
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al subir',
                    text: result.message || 'Hubo un problema con la carga del archivo.'
                });
            }
        } catch (err) {
            console.error("Error al conectar:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error de red',
                text: 'No se pudo conectar con el servidor. Intenta más tarde.'
            });
        }
    });
});
