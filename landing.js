document.addEventListener("DOMContentLoaded", () => {
  const landingPage = document.getElementById("landingPage");
  const launchButtons = document.querySelectorAll("[data-launch-platform]");
  const menuToggle = document.getElementById("landingMenuToggle");
  const navLinks = document.getElementById("landingNavLinks");
  const existingLaunchButton = document.getElementById("welcomeJudgeDirectBtn");

  launchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (landingPage) {
        landingPage.classList.add("landing-page-hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // Reuse the platform's existing direct-access flow rather than duplicating login logic.
      if (existingLaunchButton) existingLaunchButton.click();
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
});
