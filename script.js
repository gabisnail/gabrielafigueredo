(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileMenuLinks = mobileMenu?.querySelectorAll("a") ?? [];
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const yearElement = document.querySelector("#current-year");

  const modal = document.querySelector("#gallery-modal");
  const modalImage = document.querySelector("#gallery-modal-image");
  const modalCaption = document.querySelector("#gallery-modal-caption");
  const modalCloseButton = modal?.querySelector(".gallery-modal-close");
  const galleryButtons = document.querySelectorAll("[data-gallery-image]");

  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let lastFocusedElement = null;

  const prefersReducedMotion = () => motionPreference.matches;

  const getFocusableElements = (container) => {
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    return [...container.querySelectorAll(selector)].filter((element) => {
      const styles = window.getComputedStyle(element);
      return (
        !element.hasAttribute("hidden") &&
        styles.display !== "none" &&
        styles.visibility !== "hidden"
      );
    });
  };

  const setMenuState = (isOpen, { restoreFocus = false } = {}) => {
    if (!menuToggle || !mobileMenu) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu"
    );

    mobileMenu.hidden = !isOpen;
    body.classList.toggle("menu-open", isOpen);

    if (isOpen) {
      mobileMenu.querySelector("a")?.focus();
    } else if (restoreFocus) {
      menuToggle.focus();
    }
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("click", (event) => {
    if (!mobileMenu || mobileMenu.hidden || !menuToggle) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    const clickedInsideMenu = mobileMenu.contains(target);
    const clickedToggle = menuToggle.contains(target);

    if (!clickedInsideMenu && !clickedToggle) {
      setMenuState(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 860) {
      setMenuState(false);
    }
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.classList.contains("skip-link")) {
        return;
      }

      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") {
        return;
      }

      let target;
      try {
        target = document.querySelector(targetId);
      } catch {
        return;
      }

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });

      try {
        history.replaceState(null, "", targetId);
      } catch {
        window.location.hash = targetId;
      }
    });
  });

  const setCurrentNavigation = (sectionId) => {
    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${sectionId}`;

      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const observedSections = ["inicio", "servicos", "trabalhos", "contato"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && observedSections.length) {
    const navigationObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target.id) {
          setCurrentNavigation(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -58%",
        threshold: [0, 0.15, 0.4]
      }
    );

    observedSections.forEach((section) => navigationObserver.observe(section));
  }

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  const openModal = (button) => {
    if (!modal || !modalImage || !modalCaption) {
      return;
    }

    lastFocusedElement = document.activeElement;

    modalImage.src = button.dataset.galleryImage || "";
    modalImage.alt =
      button.dataset.galleryAlt ||
      "Imagem ampliada de um trabalho da Gabi Nails";
    modalCaption.textContent =
      button.dataset.galleryCaption || "Trabalho da Gabi Nails";

    modal.hidden = false;
    body.classList.add("modal-open");
    modalCloseButton?.focus();
  };

  const closeModal = () => {
    if (!modal || modal.hidden) {
      return;
    }

    modal.hidden = true;
    body.classList.remove("modal-open");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  galleryButtons.forEach((button) => {
    button.addEventListener("click", () => openModal(button));
  });

  modal?.querySelectorAll("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal && !modal.hidden) {
        closeModal();
        return;
      }

      if (menuToggle?.getAttribute("aria-expanded") === "true") {
        setMenuState(false, { restoreFocus: true });
      }
    }

    if (event.key !== "Tab" || !modal || modal.hidden) {
      return;
    }

    const focusableElements = getFocusableElements(modal);
    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px"
      }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }
})();
