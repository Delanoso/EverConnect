(function () {
  const form = document.querySelector("#inquiry-form");
  if (!form) return;

  const metaEmail = document.querySelector('meta[name="contact-email"]');
  const fallbackInbox = "hello@willowconnect.com";
  const inboxValue = (metaEmail && metaEmail.content ? metaEmail.content : fallbackInbox).trim();
  const TEAM_INBOX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inboxValue) ? inboxValue : fallbackInbox;

  const INDUSTRIES = [
    "Hospitality",
    "Hotels",
    "Food and beverage",
    "Cruise",
    "Warehousing and logistics",
    "Retail",
    "Travel",
    "Property",
    "Another industry"
  ];
  const REGIONS = ["United States", "Europe", "United States and Europe"];
  const CHANNELS = ["Phone", "Email", "Chat", "After hours"];
  const STORAGE_KEY = "willowconnect.inquiries";

  const field = {
    name: document.querySelector("#name"),
    email: document.querySelector("#email"),
    company: document.querySelector("#company"),
    phone: document.querySelector("#phone"),
    industry: document.querySelector("#industry"),
    markets: document.querySelector("#markets"),
    hours: document.querySelector("#hours"),
    message: document.querySelector("#message")
  };

  const confirmation = document.querySelector("#confirmation");
  const confirmationLead = document.querySelector("#confirmation-lead");
  const details = document.querySelector("#confirmation-details");
  const emailLink = document.querySelector("#email-link");
  const copyButton = document.querySelector("#copy-summary");
  const copyStatus = document.querySelector("#copy-status");
  const anotherButton = document.querySelector("#new-inquiry");
  const fallback = document.querySelector("#summary-fallback");
  const errorBox = document.querySelector("#form-errors");
  const errorList = document.querySelector("#form-error-list");
  const latest = document.querySelector("#latest");
  const latestText = document.querySelector("#latest-text");
  const viewLatest = document.querySelector("#view-latest");
  const messageCount = document.querySelector("#message-count");
  const regionSet = document.querySelector("#region-set");

  let currentSummary = "";

  function loadInquiries() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveInquiry(inquiry) {
    const next = loadInquiries().filter(function (item) {
      return item && item.reference !== inquiry.reference;
    });
    next.unshift(inquiry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20)));
    } catch (error) {
      // The on-page summary still works if storage is blocked.
    }
  }

  function reference() {
    const now = new Date();
    const stamp = [
      String(now.getFullYear()).slice(2),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(4);
    if (globalThis.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    let tail = "";
    bytes.forEach(function (byte) {
      tail += alphabet[byte % alphabet.length];
    });
    return "WC-" + stamp + "-" + tail;
  }

  function formatWhen(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function selectedRegion() {
    const selected = form.querySelector('input[name="region"]:checked');
    return selected ? selected.value : "";
  }

  function selectedChannels() {
    return Array.from(form.querySelectorAll('input[name="channel"]:checked'))
      .map(function (input) {
        return input.value;
      })
      .filter(function (value) {
        return CHANNELS.indexOf(value) !== -1;
      });
  }

  function summaryText(inquiry) {
    const lines = [
      "WillowConnect coverage inquiry",
      "Reference: " + inquiry.reference,
      "Submitted: " + formatWhen(inquiry.createdAt),
      "",
      "Name: " + inquiry.name,
      "Email: " + inquiry.email,
      "Company: " + inquiry.company
    ];
    if (inquiry.phone) lines.push("Phone: " + inquiry.phone);
    lines.push("Region: " + inquiry.region, "Industry: " + inquiry.industry);
    if (inquiry.markets) lines.push("Markets: " + inquiry.markets);
    if (inquiry.channels.length) lines.push("Channels: " + inquiry.channels.join(", "));
    if (inquiry.hours) lines.push("Weekly agent hours: " + inquiry.hours);
    lines.push("", "Message:", inquiry.message);
    return lines.join("\n");
  }

  function addRow(term, value) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    details.append(dt, dd);
  }

  function showErrors(errors, focusTarget) {
    errorList.replaceChildren();
    errors.forEach(function (messageText) {
      const item = document.createElement("li");
      item.textContent = messageText;
      errorList.append(item);
    });
    errorBox.hidden = false;
    confirmation.hidden = true;
    form.hidden = false;
    errorBox.focus();
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus({ preventScroll: true });
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    errorBox.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function clearErrors() {
    errorBox.hidden = true;
    errorList.replaceChildren();
    form.querySelectorAll("[aria-invalid='true']").forEach(function (node) {
      node.removeAttribute("aria-invalid");
    });
    if (regionSet) regionSet.removeAttribute("aria-invalid");
  }

  function updateCount() {
    if (!field.message || !messageCount) return;
    messageCount.textContent = String(field.message.value.length) + " / 1000";
  }

  function showLatestBanner() {
    if (!latest || !latestText) return;
    if (!confirmation.hidden) {
      latest.hidden = true;
      return;
    }
    const inquiry = loadInquiries()[0];
    if (!inquiry || !inquiry.reference) {
      latest.hidden = true;
      return;
    }
    latestText.textContent =
      "Latest inquiry on this device: " +
      inquiry.reference +
      " for " +
      (inquiry.company || "your company") +
      ".";
    latest.hidden = false;
  }

  function showConfirmation(inquiry) {
    currentSummary = summaryText(inquiry);
    details.replaceChildren();
    addRow("Reference", inquiry.reference);
    addRow("Name", inquiry.name);
    addRow("Work email", inquiry.email);
    addRow("Company", inquiry.company);
    if (inquiry.phone) addRow("Phone", inquiry.phone);
    addRow("Region", inquiry.region);
    addRow("Industry", inquiry.industry);
    if (inquiry.markets) addRow("Markets", inquiry.markets);
    if (inquiry.channels.length) addRow("Channels", inquiry.channels.join(", "));
    if (inquiry.hours) addRow("Weekly agent hours", inquiry.hours);
    addRow("Message", inquiry.message);

    confirmationLead.textContent =
      "Review the summary, then email it to WillowConnect. A copy of " +
      inquiry.reference +
      " stays in this browser.";
    const subject = "WillowConnect coverage inquiry " + inquiry.reference;
    emailLink.href =
      "mailto:" +
      TEAM_INBOX +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(currentSummary);
    copyStatus.textContent = "";
    copyButton.textContent = "Copy summary";
    fallback.hidden = true;
    form.hidden = true;
    errorBox.hidden = true;
    confirmation.hidden = false;
    showLatestBanner();
    confirmation.focus();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    confirmation.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function validate() {
    const name = field.name.value.trim();
    const email = field.email.value.trim();
    const company = field.company.value.trim();
    const phone = field.phone.value.trim();
    const region = selectedRegion();
    const industry = field.industry.value.trim();
    const markets = field.markets.value.trim();
    const hours = field.hours.value.trim();
    const note = field.message.value.trim();
    const errors = [];
    let focusTarget = null;

    function fail(node, messageText) {
      errors.push(messageText);
      if (node) {
        node.setAttribute("aria-invalid", "true");
        if (!focusTarget) focusTarget = node;
      }
    }

    clearErrors();

    if (name.length < 2 || !/\p{L}/u.test(name)) fail(field.name, "Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(field.email, "Enter a valid work email address.");
    if (company.length < 2) fail(field.company, "Enter your company name.");
    if (phone) {
      const digits = phone.replace(/\D/g, "");
      if (!/^[0-9+().\-\s]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
        fail(field.phone, "Enter a phone number with at least 7 digits, or leave it blank.");
      }
    }
    if (REGIONS.indexOf(region) === -1) {
      errors.push("Choose where your customers are.");
      if (regionSet) regionSet.setAttribute("aria-invalid", "true");
      if (!focusTarget) focusTarget = form.querySelector('input[name="region"]');
    }
    if (INDUSTRIES.indexOf(industry) === -1) fail(field.industry, "Choose an industry.");
    if (markets.length > 140) fail(field.markets, "Keep markets to 140 characters or fewer.");
    if (hours.length > 80) fail(field.hours, "Keep weekly hours to 80 characters or fewer.");
    if (note.length < 20) {
      fail(field.message, "Tell us a little more about the desk, in at least a sentence.");
    }

    if (errors.length) return { ok: false, errors: errors, focus: focusTarget };

    return {
      ok: true,
      inquiry: {
        reference: reference(),
        createdAt: new Date().toISOString(),
        name: name,
        email: email,
        company: company,
        phone: phone,
        region: region,
        industry: industry,
        markets: markets,
        channels: selectedChannels(),
        hours: hours,
        message: note
      }
    };
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const result = validate();
    if (!result.ok) {
      showErrors(result.errors, result.focus || errorBox);
      return;
    }
    saveInquiry(result.inquiry);
    showConfirmation(result.inquiry);
  });

  field.message.addEventListener("input", updateCount);

  copyButton.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(currentSummary);
      copyButton.textContent = "Copied";
      copyStatus.textContent = "Summary copied. Paste it into an email to " + TEAM_INBOX + ".";
      fallback.hidden = true;
    } catch (error) {
      fallback.hidden = false;
      fallback.value = currentSummary;
      copyStatus.textContent =
        "Clipboard access was blocked. The summary below is selected so you can copy it.";
      fallback.focus();
      fallback.select();
    }
  });

  anotherButton.addEventListener("click", function () {
    form.reset();
    clearErrors();
    updateCount();
    confirmation.hidden = true;
    form.hidden = false;
    showLatestBanner();
    field.name.focus();
  });

  if (viewLatest) {
    viewLatest.addEventListener("click", function () {
      const inquiry = loadInquiries()[0];
      if (inquiry) showConfirmation(inquiry);
    });
  }

  updateCount();
  showLatestBanner();
})();
