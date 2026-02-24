import express from "express";
import attendanceRouter from "./routes/attendances";
import usersRouter from "./routes/users"
import authRouter from "./routes/auth"

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Server Running");
});

app.use("/attendances", attendanceRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
})