(() => {
  const metaGa4Id = document
    .querySelector('meta[name="ga4-measurement-id"]')
    ?.getAttribute("content");
  const GA4_MEASUREMENT_ID = window.GA4_MEASUREMENT_ID || metaGa4Id || "G-XXXXXXXXXX";

  function loadGa4() {
    // If an inline GA snippet already initialized gtag, do not overwrite it.
    if (typeof window.gtag === "function") {
      return;
    }

    if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID === "G-XXXXXXXXXX") {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      return;
    }

    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA4_MEASUREMENT_ID);
  }

  function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  }

  function bindFormValidation() {
    // Block empty / whitespace-only submissions before they reach Netlify.
    // Runs before form tracking so blocked submits don't fire generate_lead.
    const forms = document.querySelectorAll(
      'form[data-netlify="true"], form.lead-form'
    );
    forms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        let firstInvalid = null;
        form.querySelectorAll("[required]").forEach((field) => {
          if (!firstInvalid && (!field.value || !field.value.trim())) {
            firstInvalid = field;
          }
        });
        // Honeypot: if a bot filled the hidden field, drop the submit.
        const honey = form.querySelector('[name="bot-field"]');
        const honeyFilled = honey && honey.value && honey.value.trim();
        if (firstInvalid || honeyFilled) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (firstInvalid) {
            if (typeof firstInvalid.reportValidity === "function") {
              firstInvalid.reportValidity();
            } else {
              firstInvalid.focus();
            }
          }
          return false;
        }
      });
    });
  }

  function bindFormTracking() {
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", () => {
        trackEvent("generate_lead", {
          form_name: form.getAttribute("name") || "unnamed_form",
          page_location: window.location.pathname,
        });
      });
    });
  }

  function bindPhoneClickTracking() {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach((link) => {
      link.addEventListener("click", () => {
        trackEvent("phone_click", {
          phone_number: link.getAttribute("href").replace("tel:", ""),
          page_location: window.location.pathname,
        });
      });
    });
  }

  function bindToolCompletionTracking() {
    window.trackToolCompletion = function trackToolCompletion(toolName, extra = {}) {
      trackEvent("tool_completion", {
        tool_name: toolName || "unknown_tool",
        page_location: window.location.pathname,
        ...extra,
      });
    };

    document.addEventListener("toolCompleted", (event) => {
      const detail = event.detail || {};
      trackEvent("tool_completion", {
        tool_name: detail.toolName || "unknown_tool",
        page_location: window.location.pathname,
      });
    });
  }

  loadGa4();
  bindFormValidation();
  bindFormTracking();
  bindPhoneClickTracking();
  bindToolCompletionTracking();
})();
