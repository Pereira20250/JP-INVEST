const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const LEADS_FILE = path.join(ROOT_DIR, "leads.json");
const ORDERS_FILE = path.join(ROOT_DIR, "orders.json");

const PLANS = [
  {
    id: "essencial",
    name: "Plano Essencial",
    price: "R$ 69/mes",
    tag: "Entrada inteligente",
    summary: "Para quem quer comecar a organizar a vida financeira com clareza e disciplina.",
    benefits: [
      "Acesso a curadoria JP INVESTI",
      "Direcionamento financeiro inicial",
      "Suporte por WhatsApp",
      "Atualizacoes exclusivas"
    ],
    onboarding: [
      "Receba a triagem inicial do perfil financeiro.",
      "Entre no acompanhamento basico da JP INVESTI.",
      "Use o suporte via WhatsApp para ajustes iniciais."
    ]
  },
  {
    id: "prime",
    name: "Plano Prime",
    price: "R$ 149/mes",
    tag: "Mais escolhido",
    summary: "Acompanhamento premium para clientes que desejam crescer com consistencia.",
    benefits: [
      "Tudo do Essencial",
      "Estrategia mensal personalizada",
      "Prioridade no atendimento",
      "Material exclusivo de acompanhamento"
    ],
    onboarding: [
      "Receba o plano estrategico mensal.",
      "Entre na prioridade de atendimento da JP INVESTI.",
      "Comece o acompanhamento premium com revisoes periodicas."
    ]
  },
  {
    id: "signature",
    name: "Plano Signature",
    price: "R$ 297/mes",
    tag: "Experiencia VIP",
    summary: "Uma solucao de alto nivel para atendimento proximo e posicionamento premium.",
    benefits: [
      "Tudo do Prime",
      "Mentoria individual",
      "Analise de objetivos",
      "Atendimento premium dedicado"
    ],
    onboarding: [
      "Agende a mentoria individual inicial.",
      "Receba a analise premium de objetivos.",
      "Ative o atendimento VIP dedicado."
    ]
  }
];

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function ensureJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}

function readJsonArray(filePath) {
  ensureJsonFile(filePath);

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeJsonArray(filePath, items) {
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function serveFile(req, res) {
  const routePath = req.url === "/" ? "index.html" : req.url.split("?")[0].replace(/^\/+/, "");
  const filePath = path.normalize(path.join(ROOT_DIR, routePath));

  if (!filePath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { error: "Acesso negado." });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      const shouldFallback = !path.extname(routePath);

      if (shouldFallback) {
        fs.readFile(path.join(ROOT_DIR, "index.html"), (fallbackError, fallbackData) => {
          if (fallbackError) {
            sendJson(res, 404, { error: "Arquivo nao encontrado." });
            return;
          }

          res.writeHead(200, { "Content-Type": CONTENT_TYPES[".html"] });
          res.end(fallbackData);
        });
        return;
      }

      sendJson(res, 404, { error: "Arquivo nao encontrado." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream" });
    res.end(data);
  });
}

function getPlanById(planId) {
  return PLANS.find((item) => item.id === planId);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.url === "/api/site" && req.method === "GET") {
    const leads = readJsonArray(LEADS_FILE);
    sendJson(res, 200, {
      brand: "JP INVESTI",
      whatsapp: "11976172617",
      pixKey: "219.102.888-88",
      plans: PLANS,
      metrics: {
        totalLeads: leads.length,
        activePlans: PLANS.length
      }
    });
    return;
  }

  if (req.url.startsWith("/api/plan") && req.method === "GET") {
    const requestUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const planId = requestUrl.searchParams.get("id");
    const plan = getPlanById(planId);

    if (!plan) {
      sendJson(res, 404, { success: false, message: "Plano nao encontrado." });
      return;
    }

    sendJson(res, 200, {
      success: true,
      whatsapp: "11976172617",
      pixKey: "219.102.888-88",
      plan
    });
    return;
  }

  if (req.url.startsWith("/api/order") && req.method === "GET") {
    const requestUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const orderId = requestUrl.searchParams.get("id");
    const orders = readJsonArray(ORDERS_FILE);
    const order = orders.find((item) => String(item.id) === String(orderId));

    if (!order) {
      sendJson(res, 404, { success: false, message: "Pedido nao encontrado." });
      return;
    }

    sendJson(res, 200, { success: true, order });
    return;
  }

  if (req.url === "/api/order" && req.method === "POST") {
    try {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const name = String(payload.name || "").trim();
      const phone = String(payload.phone || "").trim();
      const email = String(payload.email || "").trim();
      const planId = String(payload.planId || "").trim();
      const plan = getPlanById(planId);

      if (!name || !phone || !email || !plan) {
        sendJson(res, 400, {
          success: false,
          message: "Preencha nome, WhatsApp, email e selecione um plano valido."
        });
        return;
      }

      const orders = readJsonArray(ORDERS_FILE);
      const order = {
        id: Date.now(),
        status: "aguardando_comprovante",
        name,
        phone,
        email,
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
        pixKey: "219.102.888-88",
        whatsapp: "11976172617",
        onboarding: plan.onboarding,
        benefits: plan.benefits,
        createdAt: new Date().toISOString()
      };

      orders.unshift(order);
      writeJsonArray(ORDERS_FILE, orders);

      sendJson(res, 201, {
        success: true,
        message: "Pedido criado com sucesso.",
        order
      });
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        message: "Nao foi possivel criar o pedido."
      });
    }
    return;
  }

  if (req.url === "/api/leads" && req.method === "GET") {
    const leads = readJsonArray(LEADS_FILE);
    sendJson(res, 200, { total: leads.length, leads });
    return;
  }

  if (req.url === "/api/contact" && req.method === "POST") {
    try {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const name = String(payload.name || "").trim();
      const phone = String(payload.phone || "").trim();
      const plan = String(payload.plan || "").trim();
      const goal = String(payload.goal || "").trim();

      if (!name || !phone) {
        sendJson(res, 400, {
          success: false,
          message: "Preencha nome e WhatsApp para continuar."
        });
        return;
      }

      const leads = readJsonArray(LEADS_FILE);
      const lead = {
        id: Date.now(),
        name,
        phone,
        plan,
        goal,
        createdAt: new Date().toISOString()
      };

      leads.unshift(lead);
      writeJsonArray(LEADS_FILE, leads);

      sendJson(res, 201, {
        success: true,
        message: "Recebemos seu interesse com sucesso.",
        lead
      });
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        message: "Nao foi possivel processar o envio."
      });
    }
    return;
  }

  serveFile(req, res);
});

server.listen(PORT, () => {
  ensureJsonFile(LEADS_FILE);
  ensureJsonFile(ORDERS_FILE);
  console.log(`JP INVESTI disponivel em http://127.0.0.1:${PORT}`);
});
