import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";

// Routes
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

// Database Init
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
  }
}

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(helmet());
app.use(morgan("dev")); // Log the requests

// Arcjet - Rate limit for all routes
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, // Specifies that each request consumes 1 token
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({ error: "Too many request" });
      } else if (decision.reason.isBot()) {
        res.status(403).json({ error: "Bot access detected" });
      } else {
        res.status(403).json({ error: "Forbidden" });
      }
      return;
    }

    // Check for spoofed bots
    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      res.status(403).json({ error: "Spoofed bot detected" });
      return;
    }

    next();
  } catch (error) {
    console.log("Arcjet error:", error);
    next(error);
  }
});

app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 8000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server started in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
});
