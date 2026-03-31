import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 8080;

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

app.post("/api/login-arca", async (req, res) => {
  const { cuit, claveFiscal } = req.body || {};
  const logs = [];

  if (!cuit || !claveFiscal) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos requeridos.",
      logs: ["Error: faltan CUIT o Clave Fiscal"]
    });
  }

  let browser;

  try {
    logs.push("Abriendo navegador...");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    logs.push("Ingresando a ARCA...");
    await page.goto("https://auth.afip.gob.ar/contribuyente_/login.xhtml", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    logs.push("Cargando CUIT...");
    await page.fill('input[type="text"]', String(cuit));

    logs.push("Cargando Clave Fiscal...");
    await page.fill('input[type="password"]', String(claveFiscal));

    logs.push("Enviando formulario...");
    await page.click('button[type="submit"], input[type="submit"]');

    await page.waitForTimeout(5000);

    const contenido = await page.content();
    const urlActual = page.url();

    const loginExitoso =
      contenido.includes("Mis Servicios") ||
      contenido.includes("Administrador de Relaciones") ||
      contenido.includes("Clave Fiscal") ||
      urlActual.includes("contribuyente");

    if (loginExitoso) {
      logs.push("Login exitoso en ARCA.");
      return res.json({
        success: true,
        message: "Login exitoso en ARCA",
        logs
      });
    }

    logs.push("No se pudo confirmar el login.");
    return res.status(401).json({
      success: false,
      message: "No se pudo confirmar el login en ARCA",
      logs
    });
  } catch (error) {
    logs.push(`Error técnico: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error al intentar login en ARCA",
      logs
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
