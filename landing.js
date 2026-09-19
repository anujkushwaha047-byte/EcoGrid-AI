document.addEventListener("DOMContentLoaded", () => {
  const landingPage = document.getElementById("landingPage");
  const launchButtons = document.querySelectorAll("[data-launch-platform]");
  const menuToggle = document.getElementById("landingMenuToggle");
  const navLinks = document.getElementById("landingNavLinks");
  const existingLoginButton = document.getElementById("welcomeOpenLoginBtn");

  launchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (landingPage) {
        landingPage.classList.add("landing-page-hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // Reuse the platform's existing login experience rather than bypassing authentication.
      if (existingLoginButton) existingLoginButton.click();
    });
  });

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("landing-nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("landing-nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const animatedValues = document.querySelectorAll("[data-count]");
  const animateValue = (element) => {
    const target = Number(element.dataset.count);
    const decimals = String(element.dataset.count).includes(".") ? String(element.dataset.count).split(".")[1].length : 0;
    const startedAt = performance.now();
    const duration = 850;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("landing-revealed");
        if (entry.target.dataset.count) animateValue(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    document.querySelectorAll(".landing-pulse-card, .landing-decision-card, .landing-flow-node, [data-count]").forEach((element) => {
      element.classList.add("landing-reveal");
      revealObserver.observe(element);
    });
  } else {
    animatedValues.forEach(animateValue);
  }
});
