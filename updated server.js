const express = require('express');
const pool = require('./database'); // your existing database pool
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// Serve static frontend files from 'public' folder
app.use(express.static('public')); // Put your index.html, style.css etc. in 'public' folder

// =====================
// Basic route
// =====================
app.get('/', (req, res) => {
  res.send("Server backend is up and running.");
});

// =====================
// Users
// =====================
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users;");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database Error" });
  }
});

// =====================
// Rainfall data
// =====================
app.get('/rainfall', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rainfall_data;");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// =====================
// Harvest calculation by site
// =====================
app.get('/calculate/:site_id', async (req, res) => {
  const siteId = req.params.site_id;
  try {
    const [calcs] = await pool.query("CALL harvest_calculation(?);", [siteId]);
    res.json(calcs[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// =====================
// Recommended structures
// =====================
app.get('/recommended/:volume', async (req, res) => {
  const volume = Number(req.params.volume);
  try {
    const [struct] = await pool.query("CALL recommended_structures(?);", [volume]);
    res.json(struct[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// =====================
// Summary for user
// =====================
app.get('/summary/:user_Id', async (req, res) => {
  const userId = req.params.user_Id;
  try {
    const [summary] = await pool.query("CALL generate_summary(?);", [userId]);
    res.json(summary[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// =====================
// Login
// =====================
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [auth] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (auth.length === 0) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
    const user_cred = auth[0];
    if (user_cred.password !== password) {
      return res.status(410).json({ error: "Wrong Password Entered." });
    }
    const token = jwt.sign(
      { user_id: user_cred.userid, email: user_cred.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login Successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// =====================
// Register
// =====================
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [ifexists] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (ifexists.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }
    await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password]);
    res.json({ message: "User registered Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error while registering user." });
  }
});

// =====================
// New: Location endpoint for rainwater calculation
// =====================
app.post('/api/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    console.log("Received location from frontend:", { latitude, longitude });

    // Example: fetch average rainfall from your table
    const [rows] = await pool.query("SELECT AVG(annual_rainfall_mm) AS avgRainfall FROM rainfall_data");
    const avgRainfall = rows[0].avgRainfall || 1000; // fallback mm/year

    const roofArea = 50; // example, can later take user input
    const estimatedWater = avgRainfall * roofArea * 0.8; // liters approx.

    res.json({ estimatedWater });
  } catch (err) {
    console.error("Error in /api/location:", err);
    res.status(500).json({ error: "Server error while processing location" });
  }
});

// =====================
// Start server
// =====================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
