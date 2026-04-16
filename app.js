const plansGrid = document.getElementById("plans-grid");
const planSelect = document.getElementById("plan-select");
const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");
const copyPixButton = document.getElementById("copy-pix");
const pixKeyElement = document.getElementById("pix-key");
const metricPlans = document.getElementById("metric-plans");
const calculatorForm = document.getElementById("calculator-form");
const fallbackPlans = [
  {
    id: "essencial",
    name: "Plano Essencial",
    price: "R$ 69/mês",
    tag: "Entrada inteligente",
    summary: "Para quem quer começar a organizar a vida financeira com clareza e disciplina.",
    benefits: [
      "Acesso à curadoria JP INVESTI",
      "Direcionamento financeiro inicial",
      "Suporte por WhatsApp",
      "Atualizações exclusivas",
    ],
  },
  {
    id: "prime",
    name: "Plano Prime",
    price: "R$ 149/mês",
    tag: "Mais escolhido",
    summary: "Acompanhamento premium para clientes que desejam crescer com consistência.",
    benefits: [
      "Tudo do Essencial",
      "Estratégia mensal personalizada",
      "Prioridade no atendimento",
      "Material exclusivo de acompanhamento",
    ],
  },
  {
    id: "signature",
    name: "Plano Signature",
    price: "R$ 297/mês",
    tag: "Experiência VIP",
    summary: "Uma solução de alto nível para atendimento próximo e posicionamento premium.",
    benefits: [
      "Tudo do Prime",
      "Mentoria individual",
      "Análise de objetivos",
      "Atendimento premium dedicado",
    ],
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

async function loadSiteData() {
  try {
    const response = await fetch("/api/site");
    if (!response.ok) {
      throw new Error("API indisponível");
    }

    const data = await response.json();
    const plans = Array.isArray(data.plans) && data.plans.length ? data.plans : fallbackPlans;

    if (pixKeyElement) {
      pixKeyElement.textContent = data.pixKey || "219.102.888-88";
    }

    if (metricPlans) {
      metricPlans.textContent = String(data.metrics?.activePlans || plans.length || 0);
    }

    if (plansGrid) {
      renderPlans(plans);
    }

    if (planSelect) {
      renderPlanOptions(plans);
    }
  } catch (error) {
    if (pixKeyElement) {
      pixKeyElement.textContent = "219.102.888-88";
    }

    if (metricPlans) {
      metricPlans.textContent = String(fallbackPlans.length);
    }

    if (plansGrid) {
      renderPlans(fallbackPlans);
    }

    if (planSelect) {
      renderPlanOptions(fallbackPlans);
    }
  }
}

function renderPlans(plans) {
  if (!plans.length) {
    plansGrid.innerHTML = "<p class='form-status is-error'>Nenhum plano disponível no momento.</p>";
    return;
  }

  plansGrid.innerHTML = plans
    .map((plan, index) => {
      const benefits = plan.benefits.map((benefit) => `<li>${benefit}</li>`).join("");
      const featuredClass = index === 1 ? "featured" : "";
      const buttonClass = index === 1 ? "button-primary" : "button-secondary";
      const whatsappText = encodeURIComponent(`Olá, tenho interesse no ${plan.name} da JP INVESTI.`);

      return `
        <article class="plan-card panel ${featuredClass}">
          <span class="plan-tag">${plan.tag}</span>
          <h3>${plan.name}</h3>
          <strong class="plan-price">${plan.price}</strong>
          <p class="plan-summary">${plan.summary}</p>
          <ul class="plan-benefits">${benefits}</ul>
          <a class="button ${buttonClass}" href="https://wa.me/5511976172617?text=${whatsappText}" target="_blank" rel="noreferrer">
            Quero esse plano
          </a>
        </article>
      `;
    })
    .join("");
}

function renderPlanOptions(plans) {
  planSelect.innerHTML =
    '<option value="">Quero ajuda para escolher</option>' +
    plans.map((plan) => `<option value="${plan.name}">${plan.name}</option>`).join("");
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(leadForm);
  const payload = Object.fromEntries(formData.entries());

  formStatus.className = "form-status";
  formStatus.textContent = "Enviando solicitação...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Não foi possível enviar agora.");
    }

    formStatus.className = "form-status is-success";
    formStatus.textContent = "Solicitação enviada com sucesso. Agora você pode continuar pelo WhatsApp.";
    leadForm.reset();
  } catch (error) {
    formStatus.className = "form-status is-error";
    formStatus.textContent = error.message || "Erro ao enviar.";
  }
}

async function copyPix() {
  if (!pixKeyElement) return;

  try {
    await navigator.clipboard.writeText(pixKeyElement.textContent.trim());
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith("jp-investi-") && key !== "jp-investi-v3") {
            caches.delete(key).catch(() => {});
          }
        });
      });
    }

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (registration.active && !registration.active.scriptURL.endsWith("/sw.js")) {
          registration.unregister().catch(() => {});
        }
      });
    });

    navigator.serviceWorker.register("/sw.js").catch(() => {});
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

loadSiteData();
