const express = require('express');
const multer = require('multer');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../config/dbConfig');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // asegúrate que esta carpeta exista
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('archivo'), async (req, res) => {
    const { id_usuario } = req.body;
    const nombre_archivo = req.file.filename;

    // Forzar unidad_negocio a string
    const unidad_negocio = Array.isArray(req.body.unidad_negocio)
        ? req.body.unidad_negocio[0]
        : req.body.unidad_negocio;

    console.log("unidad_negocio:", unidad_negocio);
    console.log("id_usuario:", id_usuario);
    console.log("nombre_archivo:", nombre_archivo);

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("nombre_archivo", sql.NVarChar, nombre_archivo)
            .input("unidad_negocio", sql.NVarChar, unidad_negocio)
            .input("id_usuario", sql.Int, id_usuario)
            .query(`
                INSERT INTO ReporteArchivo (nombre_archivo, unidad_negocio, id_usuario, fecha_subida, estado)
                VALUES (@nombre_archivo, @unidad_negocio, @id_usuario, GETDATE(), 'en proceso')
            `);

        res.status(200).json({ message: "Archivo cargado correctamente." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al guardar en la base de datos." });
    }
});
module.exports = router;