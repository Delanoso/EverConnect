(function () {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.querySelector("#site-nav");

  function setOpen(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    toggle.textContent = open ? "Close" : "Menu";
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    const desktop = window.matchMedia("(min-width: 861px)");
    desktop.addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  const year = String(new Date().getFullYear());
  document.querySelectorAll(".year").forEach(function (node) {
    node.textContent = year;
  });
})();
