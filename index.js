const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Setup con 10 maestros iniciales
app.get('/api/setup', async (req, res) => {
  try {
    // Borramos la tabla si ya existía para recrearla limpia con los 10 registros
    await pool.query('DROP TABLE IF EXISTS maestros;');
    await pool.query(`
      CREATE TABLE maestros (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Los 10 maestros exactos
    const maestrosIniciales = [
      'Alex Profe',               // ID 1
      'María García',             // ID 2
      'Carlos Pérez',             // ID 3
      'Raúl Nava López',          // ID 4
      'Laura Martínez Gómez',     // ID 5
      'Fernando Hernández Silva', // ID 6
      'Sofía López Torres',       // ID 7
      'Daniel Ramírez Vilchis',   // ID 8
      'Ana Patricia Castro',      // ID 9
      'Jorge Luis Morales'        // ID 10
    ];

    for (const nombre of maestrosIniciales) {
      await pool.query('INSERT INTO maestros (nombre) VALUES ($1);', [nombre]);
    }

    res.json({ mensaje: '¡Base de datos inicializada con éxito con los 10 maestros!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Búsqueda de maestros por ID
app.get('/api/maestros/:id', async (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  if (isNaN(numId) || numId <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    let result = await pool.query('SELECT * FROM maestros WHERE id = $1', [numId]);

    // Si pides un número mayor a 10, lo crea dinámicamente para que nunca falle
    if (result.rows.length === 0) {
      const nombreDinamico = `Maestro Profesor #${numId}`;
      await pool.query(
        'INSERT INTO maestros (id, nombre) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;',
        [numId, nombreDinamico]
      );
      result = await pool.query('SELECT * FROM maestros WHERE id = $1', [numId]);
    }

    const maestro = result.rows[0];

    res.json({
      data: {
        id: maestro.id.toString(),
        nombre: maestro.nombre,
        created_at: maestro.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});