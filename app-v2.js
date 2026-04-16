const plansGrid = document.getElementById("plans-grid");
const planSelect = document.getElementById("plan-select");
const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");
const copyPixButton = document.getElementById("copy-pix");
const metricPlans = document.getElementById("metric-plans");
const calculatorForm = document.getElementById("calculator-form");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const checkoutPlanName = document.getElementById("checkout-plan-name");
const checkoutPlanPrice = document.getElementById("checkout-plan-price");
const checkoutPlanSummary = document.getElementById("checkout-plan-summary");
const checkoutPlanBenefits = document.getElementById("checkout-plan-benefits");
const checkoutPixKey = document.getElementById("checkout-pix-key");
const accessPlanName = document.getElementById("access-plan-name");
const accessPlanPrice = document.getElementById("access-plan-price");
const accessOrderId = document.getElementById("access-order-id");
const accessOrderStatus = document.getElementById("access-order-status");
const accessCustomerName = document.getElementById("access-customer-name");
const accessOnboarding = document.getElementById("access-onboarding");
const accessWhatsapp = document.getElementById("access-whatsapp");
const INTEREST_EMAIL = "pereira_joaop@yahoo.com.br";

const fallbackPlans = [
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
      "Atualizacoes exclusivas",
    ],
    onboarding: [
      "Receba a triagem inicial do perfil financeiro.",
      "Entre no acompanhamento basico da JP INVESTI.",
      "Use o suporte via WhatsApp para ajustes iniciais.",
    ],
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
      "Material exclusivo de acompanhamento",
    ],
    onboarding: [
      "Receba o plano estrategico mensal.",
      "Entre na prioridade de atendimento da JP INVESTI.",
      "Comece o acompanhamento premium com revisoes periodicas.",
    ],
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
      "Atendimento premium dedicado",
    ],
    onboarding: [
      "Agende a mentoria individual inicial.",
      "Receba a analise premium de objetivos.",
      "Ative o atendimento VIP dedicado.",
    ],
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPlanIdFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("plan") || "prime";
}

function renderPlans(plans) {
  if (!plansGrid) return;

  plansGrid.innerHTML = plans
    .map((plan, index) => {
      const benefits = plan.benefits.map((benefit) => `<li>${benefit}</li>`).join("");
      const featuredClass = index === 1 ? "featured" : "";
      const buttonClass = index === 1 ? "button-primary" : "button-secondary";

      return `
        <article class="plan-card panel ${featuredClass}">
          <span class="plan-tag">${plan.tag}</span>
          <h3>${plan.name}</h3>
          <strong class="plan-price">${plan.price}</strong>
          <p class="plan-summary">${plan.summary}</p>
          <ul class="plan-benefits">${benefits}</ul>
          <a class="button ${buttonClass}" href="/pagamento.html?plan=${plan.id}">
            Assinar este plano
          </a>
        </article>
      `;
    })
    .join("");
}

function renderPlanOptions(plans) {
  if (!planSelect) return;

  planSelect.innerHTML =
    '<option value="">Quero ajuda para escolher</option>' +
    plans.map((plan) => `<option value="${plan.name}">${plan.name}</option>`).join("");
}

async function loadSiteData() {
  try {
    const response = await fetch(`/api/site?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("API indisponivel");

    const data = await response.json();
    const plans = Array.isArray(data.plans) && data.plans.length ? data.plans : fallbackPlans;

    if (metricPlans) {
      metricPlans.textContent = String(data.metrics?.activePlans || plans.length || 0);
    }

    renderPlans(plans);
    renderPlanOptions(plans);
  } catch (error) {
    if (metricPlans) {
      metricPlans.textContent = String(fallbackPlans.length);
    }

    renderPlans(fallbackPlans);
    renderPlanOptions(fallbackPlans);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(leadForm);
  const payload = Object.fromEntries(formData.entries());

  formStatus.className = "form-status";
  formStatus.textContent = "Enviando solicitacao...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Nao foi possivel enviar agora.");

    const subject = encodeURIComponent(`Novo interesse JP INVESTI - ${payload.name || "Lead"}`);
    const body = encodeURIComponent(
      [
        "Novo formulario de interesse JP INVESTI",
        "",
        `Nome: ${payload.name || ""}`,
        `WhatsApp: ${payload.phone || ""}`,
        `Plano desejado: ${payload.plan || "Nao informado"}`,
        `Objetivo: ${payload.goal || "Nao informado"}`,
      ].join("\n")
    );

    formStatus.className = "form-status is-success";
    formStatus.textContent = `Solicitacao enviada com sucesso. Abrindo e-mail para ${INTEREST_EMAIL}.`;
    window.location.href = `mailto:${INTEREST_EMAIL}?subject=${subject}&body=${body}`;
    leadForm.reset();
  } catch (error) {
    formStatus.className = "form-status is-error";
    formStatus.textContent = error.message || "Erro ao enviar.";
  }
}

async function copyPix() {
  if (!checkoutPixKey || !copyPixButton) return;

  try {
    await navigator.clipboard.writeText(checkoutPixKey.textContent.trim());
    copyPixButton.textContent = "Pix copiado";
    setTimeout(() => {
      copyPixButton.textContent = "Copiar chave Pix";
    }, 1800);
  } catch (error) {
    copyPixButton.textContent = "Copie manualmente";
  }
}

function calculateInvestment(event) {
  event.preventDefault();

  const formData = new FormData(calculatorForm);
  const initialAmount = Number(formData.get("initialAmount") || 0);
  const monthlyAmount = Number(formData.get("monthlyAmount") || 0);
  const months = Number(formData.get("months") || 0);
  const monthlyRate = Number(formData.get("monthlyRate") || 0) / 100;

  let total = initialAmount;

  for (let month = 1; month <= months; month += 1) {
    total = total * (1 + monthlyRate) + monthlyAmount;
  }

  const totalInvested = initialAmount + monthlyAmount * months;
  const totalInterest = total - totalInvested;

  document.getElementById("result-total").textContent = formatCurrency(total);
  document.getElementById("result-invested").textContent = formatCurrency(totalInvested);
  document.getElementById("result-interest").textContent = formatCurrency(totalInterest);
  document.getElementById("result-months").textContent = `${months} meses`;
}

async function loadCheckoutPlan() {
  if (!checkoutPlanName) return;

  const planId = getPlanIdFromUrl();

  try {
    const response = await fetch(`/api/plan?id=${encodeURIComponent(planId)}&v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Plano nao encontrado");

    const data = await response.json();
    const plan = data.plan;

    checkoutPlanName.textContent = plan.name;
    checkoutPlanPrice.textContent = plan.price;
    checkoutPlanSummary.textContent = plan.summary;
    checkoutPlanBenefits.innerHTML = plan.benefits.map((benefit) => `<li>${benefit}</li>`).join("");
    checkoutPixKey.textContent = data.pixKey || "219.102.888-88";
  } catch (error) {
    const plan = fallbackPlans.find((item) => item.id === planId) || fallbackPlans[1];
    checkoutPlanName.textContent = plan.name;
    checkoutPlanPrice.textContent = plan.price;
    checkoutPlanSummary.textContent = plan.summary;
    checkoutPlanBenefits.innerHTML = plan.benefits.map((benefit) => `<li>${benefit}</li>`).join("");
    checkoutPixKey.textContent = "219.102.888-88";
  }
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const planId = getPlanIdFromUrl();
  const formData = new FormData(checkoutForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    planId,
  };

  checkoutStatus.className = "form-status";
  checkoutStatus.textContent = "Gerando pedido...";

  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Nao foi possivel criar o pedido.");

    checkoutStatus.className = "form-status is-success";
    checkoutStatus.textContent = "Pedido criado com sucesso. Redirecionando...";
    window.location.href = `/acesso.html?order=${data.order.id}`;
  } catch (error) {
    checkoutStatus.className = "form-status is-error";
    checkoutStatus.textContent = error.message || "Erro ao criar o pedido.";
  }
}

async function loadAccessOrder() {
  if (!accessPlanName) return;

  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("order");

  if (!orderId) {
    accessPlanName.textContent = "Pedido nao encontrado";
    return;
  }

  try {
    const response = await fetch(`/api/order?id=${encodeURIComponent(orderId)}&v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Pedido nao encontrado");

    const data = await response.json();
    const order = data.order;
    const whatsappText = encodeURIComponent(
      `Ola, acabei de pagar o ${order.planName} da JP INVESTI. Pedido ${order.id}. Vou enviar meu comprovante agora.`
    );

    accessPlanName.textContent = order.planName;
    accessPlanPrice.textContent = order.planPrice;
    accessOrderId.textContent = String(order.id);
    accessOrderStatus.textContent = order.status.replaceAll("_", " ");
    accessCustomerName.textContent = order.name;
    accessOnboarding.innerHTML = order.onboarding.map((item) => `<li>${item}</li>`).join("");
    accessWhatsapp.href = `https://wa.me/5511976172617?text=${whatsappText}`;
  } catch (error) {
    accessPlanName.textContent = "Pedido nao encontrado";
    accessPlanPrice.textContent = "R$ 0,00";
    accessOnboarding.innerHTML = "<li>Volte para os planos e gere um novo pedido.</li>";
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  });
}

if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key).catch(() => {}));
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", handleSubmit);
}

if (copyPixButton) {
  copyPixButton.addEventListener("click", copyPix);
}

if (calculatorForm) {
  calculatorForm.addEventListener("submit", calculateInvestment);
  calculatorForm.requestSubmit();
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", handleCheckoutSubmit);
}

loadSiteData();
loadCheckoutPlan();
loadAccessOrder();
