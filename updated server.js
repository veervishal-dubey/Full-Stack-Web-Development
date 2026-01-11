// =========================
// used 2 api , 1 for location , 2nd for data at that  location 
// server.js — RTRWH Backend
// =========================
const express = require('express');
const pool = require('./database'); // your MySQL pool
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // for external API
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(express.json());           // parse JSON
app.use(express.static('public')); // serve frontend files from public/

// ===== Home route =====
app.get('/', (req, res) => {
  res.send("Server backend is up and running.");
});

// ===== Users =====
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users;");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database Error" });
  }
});

// ===== Rainfall =====
app.get('/rainfall', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rainfall_data;");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ===== Harvest calculation by site =====
app.get('/calculate/:site_id', async (req, res) => {
  const siteId = req.params.site_id;
  try {
    const [calcs] = await pool.query("CALL harvest_calculation(?);", [siteId]);
    res.json(calcs[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ===== Recommended structures =====
app.get('/recommended/:volume', async (req, res) => {
  const volume = Number(req.params.volume);
  try {
    const [struct] = await pool.query("CALL recommended_structures(?);", [volume]);
    res.json(struct[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ===== Summary for user =====
app.get('/summary/:user_Id', async (req, res) => {
  const userId = req.params.user_Id;
  try {
    const [summary] = await pool.query("CALL generate_summary(?);", [userId]);
    res.json(summary[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ===== Login =====
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [auth] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (auth.length === 0) return res.status(401).json({ error: "Invalid Credentials" });

    const user_cred = auth[0];
    if (user_cred.password !== password)
      return res.status(410).json({ error: "Wrong Password Entered." });

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

// ===== Register =====
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [ifexists] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (ifexists.length > 0) return res.status(409).json({ error: "User already exists" });

    await pool.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password]);
    res.json({ message: "User registered Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error while registering user." });
  }
});

// ===== NEW: Receive location & fetch real rainfall from OpenWeatherMap =====
app.post('/api/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude)
      return res.status(400).json({ error: "Latitude and longitude required" });

    console.log("Received location from frontend:", { latitude, longitude });

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data?.current) {
      return res.status(500).json({ error: "Could not fetch rainfall data" });
    }

    // Rainfall in last 1 hour (mm)
    const rainfall_mm = data.current?.rain?.["1h"] || 0;

    // Example roof area
    const roofArea = 50; // m²
    const estimatedWater = rainfall_mm * roofArea * 0.8; // liters approx

    res.json({
      latitude,
      longitude,
      rainfall_mm,
      estimatedWater
    });

  } catch (err) {
    console.error("Error fetching rainfall data:", err);
    res.status(500).json({ error: "Server error while fetching rainfall data" });
  }
});

// ===== Start server =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

