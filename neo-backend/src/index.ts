// neo-backend/src/index.ts
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import authRouter from "./routes/auth";
import commentsRouter from "./routes/comments";
import notificationsRouter from "./routes/notifications";
import productsRouter from "./routes/products";
import reviewsRouter from "./routes/reviews";
import usersRouter from "./routes/users";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

/**
 * TELEFONDAN (Expo Go) görsel açılacaksa bu şart:
 * .env içine bunu yaz:
 * PUBLIC_BASE_URL=http://192.168.1.50:4000   (senin PC'nin IP'si)
 *
 * Yoksa localhost döner ve telefonda resimler görünmez.
 */
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

// Base64 resimler için büyük payload limiti
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ origin: "*" }));

// uploads klasörü yoksa oluştur (DİKKAT: "uploads" yazıyor)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// statik servis
app.use("/uploads", express.static(uploadsDir));

// multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

const upload = multer({ storage });

// upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Dosya bulunamadı." });

  const url = `${PUBLIC_BASE_URL}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get("/", (_req, res) => {
  res.json({ message: "NEO Backend API çalışıyor" });
});

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/reviews", reviewsRouter);
app.use("/comments", commentsRouter); // Gelişmiş yorum sistemi
app.use("/notifications", notificationsRouter); // Bildirim sistemi
app.use("/users", usersRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`NEO backend ${PUBLIC_BASE_URL} üzerinde çalışıyor`);
});
