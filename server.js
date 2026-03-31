import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    ok: true,
    app: "ARCA Login API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy"
  });
});

app.post("/api/login-arca", (req, res) => {
  const { cuit, claveFiscal } = req.body || {};

  if (!cuit || !claveFiscal) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos.",
      logs: [
        "Validando request...",
        "Error: faltan CUIT o Clave Fiscal"
      ]
    });
  }

  const logs = [
    "Iniciando login a ARCA...",
    `Ingresando CUIT: ${String(cuit)}`,
    "Ingresando Clave Fiscal...",
    "Login simulado OK"
  ];

  return res.json({
    success: true,
    message: "Login simulado OK",
    logs
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
