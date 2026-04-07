import express from "express";
import attendanceRouter from "./routes/attendances";
import usersRouter from "./routes/users"
import authRouter from "./routes/auth"
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true
// }));
app.use(cors({
  origin: "http://localhost:3000",  // Next.js の URL
  credentials: true,               // Cookie を通す（JWT認証に必要）
}));

app.use(express.static(path.join(__dirname, "../../")));

app.get("/", (req, res) => {
  res.send("API Server Running");
});

app.use("/attendances", attendanceRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);

app.listen(4000, () => {
  console.log("Server started on http://localhost:4000");
})

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});