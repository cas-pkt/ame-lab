require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const sql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// 📁 Configuración del almacenamiento con multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // crea la carpeta si no existe
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
const uploadRoute = require('./routes/upload');


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    auth: {
        user: "39b33e954ed129",
        pass: "34b83cca14520f"
    }
});

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/api', uploadRoute);

// Ruta para abrir login.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

sql.connect(dbConfig)
    .then(() => console.log("Conexión exitosa a SQL Server :3!"))
    .catch(err => console.error(" :( Error en la conexión a SQL Server:", err));

// REGISTRAR
app.post("/api/register", async (req, res) => {
    const { nombre, correo, password, id_laboratorio, id_rol } = req.body;

    try {
        let pool = await sql.connect(dbConfig);

        // 🔍 Verificar si el correo ya está registrado
        let checkUser = await pool.request()
            .input("correo", sql.NVarChar, correo)
            .query("SELECT id_usuario FROM Usuarios WHERE correo = @correo");

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: "❌ El correo ya está registrado. Usa otro correo." });
        }

        // 🔍 Verificar si el id_laboratorio existe en la tabla Laboratorios
        let checkLab = await pool.request()
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .query("SELECT id_laboratorio FROM Laboratorios WHERE id_laboratorio = @id_laboratorio");

        if (checkLab.recordset.length === 0) {
            return res.status(400).json({ message: "❌ El laboratorio seleccionado no existe." });
        }

        // 🔒 Hashear la contraseña
        let hashedPassword = await bcrypt.hash(password, 10);

        // 📝 Insertar usuario
        let result = await pool.request()
            .input("nombre", sql.NVarChar, nombre)
            .input("correo", sql.NVarChar, correo)
            .input("password_hash", sql.NVarChar, hashedPassword)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .query(`
                INSERT INTO Usuarios (nombre, correo, password_hash, id_laboratorio) 
                OUTPUT INSERTED.id_usuario
                VALUES (@nombre, @correo, @password_hash, @id_laboratorio)
            `);

        const id_usuario = result.recordset[0].id_usuario;

        // 🔗 Insertar el rol en UsuarioRoles
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("id_rol", sql.Int, id_rol)
            .query(`
                INSERT INTO UsuarioRoles (id_usuario, id_rol) 
                VALUES (@id_usuario, @id_rol)
            `);

        res.json({ message: `✅ Usuario registrado con éxito en el laboratorio ${id_laboratorio} y rol ${id_rol}` });

    } catch (err) {
        console.error("❌ Error en el registro:", err);
        res.status(500).json({ message: "Error al registrar usuario.", error: err.message });
    }
});

//  Iniciar sesión
app.post("/login", async (req, res) => {
    const { correo, password } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("correo", sql.NVarChar, correo)
            .query(`
                SELECT u.id_usuario, u.nombre, u.correo, u.password_hash, r.id_rol 
                FROM Usuarios u
                INNER JOIN UsuarioRoles r ON u.id_usuario = r.id_usuario
                WHERE u.correo = @correo
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Correo no registrado" });
        }

        let user = result.recordset[0];

        //const isMatch = await bcrypt.compare(password, user.password_hash);
        const isMatch = password === user.password_hash;
        if (!isMatch) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }


        res.json({
            message: "Inicio de sesión exitoso",
            user: {
                id_usuario: user.id_usuario,
                nombre: user.nombre,
                correo: user.correo,
                id_rol: user.id_rol
            }
        });

    } catch (err) {
        console.error("Error en el servidor:", err);
        res.status(500).json({ message: "Error en el servidor", error: err.message });
    }
});

app.post("/api/recuperar-password", async (req, res) => {
    const { correo } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("correo", sql.VarChar, correo)
            .query("SELECT id_usuario FROM Usuarios WHERE correo = @correo");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Correo no encontrado" });
        }

        const token = Math.random().toString(36).substring(2, 8); // Token temporal (simulado)
        console.log(`🔐 Token para ${correo}: ${token}`);

        // Guardar token en base de datos
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("token", sql.VarChar, token)
            .query("INSERT INTO TokensRecuperacion (id_usuario, token) VALUES (@id_usuario, @token)");

        await transporter.sendMail({
            from: '"Soporte PIAGET" <soporte@piaget.com>',
            to: correo,
            subject: "🔐 Recuperación de contraseña",
            html: `
                <h3>Recuperación de contraseña</h3>
                <p>Tu token de recuperación es:</p>
                <h2 style="color:#11319E">${token}</h2>
                <p>Ingresa este token en la aplicación para restablecer tu contraseña.</p>
            `
        });

        res.json({
            message: "Correo enviado correctamente. Revisa tu bandeja de entrada (simulado).",
            token // Para pruebas visuales, puedes ocultarlo en producción
        });

    } catch (err) {
        console.error("❌ Error al enviar correo:", err);
        res.status(500).json({ message: "Error al enviar correo", error: err.message });
    }
});

app.post("/api/reset-password", async (req, res) => {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
        return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    try {
        const pool = await sql.connect(dbConfig);

        // Buscar el token en la base de datos
        const tokenResult = await pool.request()
            .input("token", sql.VarChar, token)
            .query("SELECT id_usuario FROM TokensRecuperacion WHERE token = @token");

        if (tokenResult.recordset.length === 0) {
            return res.status(404).json({ message: "Token inválido o expirado." });
        }

        const id_usuario = tokenResult.recordset[0].id_usuario;

        // Actualizar la contraseña
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("nuevaPassword", sql.VarChar, nuevaPassword)
            .query("UPDATE Usuarios SET password = @nuevaPassword WHERE id_usuario = @id_usuario");

        // Eliminar el token después de usarlo
        await pool.request()
            .input("token", sql.VarChar, token)
            .query("DELETE FROM TokensRecuperacion WHERE token = @token");

        return res.json({ message: "Contraseña restablecida correctamente." });

    } catch (err) {
        console.error("❌ Error al restablecer:", err);
        return res.status(500).json({ message: "Error interno", error: err.message });
    }
});

//Crear Reportes
app.post("/crearReporte", async (req, res) => {
    const { id_usuario, id_equipo, id_laboratorio, descripcion } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("id_equipo", sql.Int, id_equipo)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("fecha_hora", sql.DateTime, new Date()) // Fecha y hora actuales
            .input("estatus", sql.NVarChar, "Pendiente") // Estatus por defecto
            .query(`
                INSERT INTO Reportes (id_usuario, id_equipo, id_laboratorio, descripcion, fecha_hora, estatus) 
                VALUES (@id_usuario, @id_equipo, @id_laboratorio, @descripcion, @fecha_hora, @estatus)
            `);

        res.json({ message: "✅ Reporte creado exitosamente", estatus: "Pendiente" });
    } catch (err) {
        res.status(500).json({ message: "❌ Error en el servidor", error: err.message });
    }
});

app.get("/api/niveles", async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT id_nivel, nombre_nivel FROM Niveles ORDER BY id_nivel ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener niveles", error: err.message });
    }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                VISTAS DE ADMIN 
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Main page del Admin
app.get("/gestionReportes.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "gestionReportes.html"));
});

app.get('/api/archivos', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM ReporteArchivo ORDER BY fecha_subida DESC');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener archivos:', error);
        res.status(500).json({ message: 'Error al cargar los archivos' });
    }
});


app.get("/api/dashboard/kpis", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
        SELECT
            SUM(CASE WHEN estado = 'Procesado' THEN 1 ELSE 0 END) AS procesados,
            SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) AS enProceso,
            SUM(CASE WHEN estado = 'Fallido' THEN 1 ELSE 0 END) AS fallidos,
            COUNT(*) AS totales
        FROM ReporteArchivo
    `);

        const row = result.recordset[0];

        res.json({
            procesados: row.procesados,
            enProceso: row.enProceso,
            fallidos: row.fallidos,
            totales: row.totales
        });

    } catch (err) {
        console.error("Error al obtener KPIs:", err);
        res.status(500).json({ message: "Error del servidor" });
    }
});

app.get("/api/reportes/recientes", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);

        const result = await pool.request().query(`
      SELECT TOP 10 
        r.id_reporte_archivo,
        r.nombre,
        r.fecha_subida,
        r.estado,
        u.nombre AS nombre_usuario,
        ad.unidad_negocio
      FROM ReporteArchivo r
      LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario
      LEFT JOIN ArchivoDetalle ad ON ad.id_reporte_archivo = r.id_reporte_archivo
      ORDER BY r.fecha_subida DESC
    `);

        res.json(result.recordset);

    } catch (err) {
        console.error("Error al obtener reportes recientes:", err);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// Historial de reportes
app.get("/api/historialReportes", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT 
                r.id_reporte,
                e.numero_equipo,
                l.nombre_laboratorio,
                r.descripcion,
                r.fecha_hora,
                r.estatus,
                r.observaciones,
                u.nombre,
                n.nombre_nivel AS nivel_usuario
            FROM Reportes r
            INNER JOIN Equipos e ON r.id_equipo = e.id_equipo
            INNER JOIN Laboratorios l ON r.id_laboratorio = l.id_laboratorio
            LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario
            LEFT JOIN Niveles n ON u.id_nivel = n.id_nivel
            ORDER BY r.fecha_hora DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error al obtener historial de reportes:", error);
        res.status(500).json({ message: "Error al obtener historial de reportes", error: error.message });
    }
});

// Obtener usuarios
app.get("/api/usuarios", async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query(`
            SELECT 
                u.id_usuario, 
                u.nombre, 
                u.correo,
                l.nombre_laboratorio AS laboratorio,
                n.nombre_nivel AS nivel,
                r.nombre_rol AS rol
            FROM Usuarios u
            LEFT JOIN Laboratorios l ON u.id_laboratorio = l.id_laboratorio
            LEFT JOIN Niveles n ON u.id_nivel = n.id_nivel
            LEFT JOIN UsuarioRoles ur ON u.id_usuario = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id_rol
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener los usuarios", error: err.message });
    }
});

// Obtener un usuario por ID
app.get("/api/usuarios/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT u.id_usuario, u.nombre, u.correo, 
                    r.nombre_rol AS rol
                FROM Usuarios u
                LEFT JOIN UsuarioRoles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN Roles r ON ur.id_rol = r.id_rol
                WHERE u.id_usuario = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(result.recordset[0]);  // 🔥 Enviamos el usuario con el nivel correcto
    } catch (err) {
        console.error("❌ Error al obtener el usuario:", err);
        res.status(500).json({ message: "Error al obtener el usuario", error: err.message });
    }
});

//Agregar un usuario
app.post("/api/usuarios", async (req, res) => {
    try {
        console.log("📩 Recibiendo datos:", req.body);
        const { nombre, correo, rol } = req.body;

        if (!nombre || !correo || !rol) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }


        if (isNaN(rol) || ![1, 2].includes(parseInt(rol))) {
            return res.status(400).json({ message: "El rol debe ser 1 (Usuario) o 2 (Administrador)" });
        }

        const pool = await sql.connect(dbConfig);

        // Verificar si el correo ya existe
        const checkCorreo = await pool.request()
            .input("correo", sql.NVarChar, correo)
            .query("SELECT * FROM Usuarios WHERE correo = @correo");

        if (checkCorreo.recordset.length > 0) {
            return res.status(400).json({ message: "❌ Este correo ya está registrado" });
        }

        // 🔐 Generar contraseña temporal y hashearla
        const passwordTemporal = "Temp1234";
        const passwordHash = await bcrypt.hash(passwordTemporal, 10);

        // 📝 Insertar usuario
        const result = await pool.request()
            .input("nombre", sql.NVarChar, nombre)
            .input("correo", sql.NVarChar, correo)
            .input("password_hash", sql.NVarChar, passwordHash)
            .query(`
                INSERT INTO Usuarios (nombre, correo, password_hash, )
                OUTPUT INSERTED.id_usuario
                VALUES (@nombre, @correo, @password_hash)
            `);

        const id_usuario = result.recordset[0].id_usuario;

        // Rol
        await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .input("id_rol", sql.Int, rol)
            .query("INSERT INTO UsuarioRoles (id_usuario, id_rol) VALUES (@id_usuario, @id_rol)");

        // 🔔 Insertar notificación general para administradores (usuario 0)
        await pool.request()
            .input("id_usuario", sql.Int, 0)
            .input("mensaje", sql.NVarChar, `👤 Se agregó un nuevo usuario: ${nombre}`)
            .query("INSERT INTO Notificaciones (id_usuario, mensaje) VALUES (@id_usuario, @mensaje)");


        res.status(201).json({
            message: "✅ Usuario creado exitosamente",
            password_temporal: passwordTemporal
        });

    } catch (err) {
        console.error("❌ Error al agregar usuario:", err.message);
        res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
});

// Actualizar un usuario
app.put("/api/usuarios/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { nombre, correo, rol } = req.body;

        rol = rol ? parseInt(rol) : null;

        if (!nombre || !correo || !rol) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        if (isNaN(rol) || ![1, 2].includes(rol)) {
            return res.status(400).json({ message: "El rol debe ser 1 (Usuario) o 2 (Administrador)" });
        }

        let pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input("id", sql.Int, id)
            .input("nombre", sql.NVarChar, nombre)
            .input("correo", sql.NVarChar, correo)
            .query(`
                UPDATE Usuarios 
                SET nombre = @nombre, correo = @correo
                WHERE id_usuario = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        let checkRole = await pool.request()
            .input("id_usuario", sql.Int, id)
            .query("SELECT id_rol FROM UsuarioRoles WHERE id_usuario = @id_usuario");

        if (checkRole.recordset.length > 0) {
            await pool.request()
                .input("id_usuario", sql.Int, id)
                .input("id_rol", sql.Int, rol)
                .query("UPDATE UsuarioRoles SET id_rol = @id_rol WHERE id_usuario = @id_usuario");
        } else {
            await pool.request()
                .input("id_usuario", sql.Int, id)
                .input("id_rol", sql.Int, rol)
                .query("INSERT INTO UsuarioRoles (id_usuario, id_rol) VALUES (@id_usuario, @id_rol)");
        }

        res.json({ message: "✅ Usuario actualizado correctamente" });

    } catch (err) {
        console.error("❌ Error al actualizar usuario:", err.message);
        res.status(500).json({ message: "❌ Error al actualizar el usuario", error: err.message });
    }
});

// Eliminar un usuario
app.delete("/api/usuarios/:id", async (req, res) => {
    try {
        const { id } = req.params;

        let pool = await sql.connect(dbConfig);

        // Primero eliminamos el rol del usuario en UsuarioRoles
        await pool.request()
            .input("id_usuario", sql.Int, id)
            .query("DELETE FROM UsuarioRoles WHERE id_usuario = @id_usuario");

        // Luego eliminamos al usuario en Usuarios
        let result = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Usuarios WHERE id_usuario = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "✅ Usuario eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ message: "❌ Error al eliminar el usuario", error: err.message });
    }
});

// 🔔 Obtener notificaciones por usuario
app.get("/api/notificaciones/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("id_usuario", sql.Int, id_usuario)
            .query(`
                SELECT id_notificacion, mensaje, fecha, leida
                FROM Notificaciones
                WHERE (id_usuario = @id_usuario OR id_usuario = 0)
                ORDER BY fecha DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener notificaciones", error: error.message });
    }
});

app.put("/api/notificaciones/:id/leida", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .query("UPDATE Notificaciones SET leida = 1 WHERE id_notificacion = @id");

        res.json({ message: "✅ Notificación marcada como leída" });
    } catch (err) {
        console.error("❌ Error al marcar como leída:", err);
        res.status(500).json({ message: "Error al actualizar notificación", error: err.message });
    }
});

// Eliminar notificación
app.delete("/api/notificaciones/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Notificaciones WHERE id_notificacion = @id");

        res.json({ message: "🗑️ Notificación eliminada correctamente" });
    } catch (err) {
        console.error("❌ Error al eliminar notificación:", err);
        res.status(500).json({ message: "Error al eliminar notificación", error: err.message });
    }
});

app.get('/api/roles', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);  // Aseguramos que se usa sql.connect correctamente
        let result = await pool.request().query("SELECT id_rol, nombre_rol FROM Roles");

        res.json(result.recordset);  // Devuelve la lista de roles correctamente
    } catch (error) {
        console.error("❌ Error al obtener roles:", error);
        res.status(500).json({ message: "Error al obtener roles", error: error.message });
    }
});


import("open").then((open) => {
    open.default(`http://localhost:${PORT}`);
});

// Iniciar el servidor
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

});

//PARA INICIAR EL SERVIDOR RUN EN TERMINAL node server.js
