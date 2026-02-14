const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "Backend", "config", ".env") });

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Test Route
app.get("/", (req, res) => {
  res.send("Interview Readiness Tracker API Running");
});

const PORT = process.env.PORT || 5000;
const connectDB = require("./Backend/config/db");
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
