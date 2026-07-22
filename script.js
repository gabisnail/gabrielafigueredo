(() => {
  "use strict";

  const SELECTORS = {
    header: ".site-header",
    menuToggle: ".menu-toggle",
    mobileMenu: "#mobile-menu",
    navLink: "[data-nav-link]",
    reveal: ".reveal",
    staggerGroup: "[data-stagger]",
    parallax: "[data-parallax]",
    galleryButton: "[data-gallery-image]",
    modal: "#gallery-modal",
    modalImage: "#gallery-modal-image",
    modalCaption: "#gallery-modal-caption",
    modalContent: ".gallery-modal-content",
    modalClose: ".gallery-modal-close",
    year: "#current-year"
  };

  const body = document.body;
  const root = document.documentElement;
  const header = document.querySelector(SELECTORS.header);
  const menuToggle = document.querySelector(SELECTORS.menuToggle);
  const mobileMenu = document.querySelector(SELECTORS.mobileMenu);
  const navLinks = [...document.querySelectorAll(SELECTORS.navLink)];
  const modal = document.querySelector(SELECTORS.modal);
  const modalImage = document.querySelector(SELECTORS.modalImage);
  const modalCaption = document.querySelector(SELECTORS.modalCaption);
  const modalContent = document.querySelector(SELECTORS.modalContent);
  const modalCloseButton = document.querySelector(SELECTORS.modalClose);
  const galleryButtons = [...document.querySelectorAll(SELECTORS.galleryButton)];
  const revealElements = [...document.querySelectorAll(SELECTORS.reveal)];
  const parallaxElements = [...document.querySelectorAll(SELECTORS.parallax)];
  const yearElement = document.querySelector(SELECTORS.year);

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const desktopQuery = window.matchMedia("(min-width: 860px)");
  const parallaxQuery = window.matchMedia("(min-width: 768px)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  const state = {
    lastFocusedElement: null,
    menuCloseTimer: 0,
    modalCloseTimer: 0,
    scrollFrame: 0,
    revealObserver: null,
    navigationObserver: null
  };

  const prefersReducedMotion = () => reducedMotionQuery.matches;

  const getFocusableElements = (container) => {
    if (!container) {
      return [];
    }

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
        !element.closest("[hidden]") &&
        styles.display !== "none" &&
        styles.visibility !== "hidden"
      );
    });
  };

  const setPageInert = (isInert) => {
    const pageRegions = [
      document.querySelector("header"),
      document.querySelector("main"),
      document.querySelector("footer"),
      document.querySelector(".whatsapp-float")
    ].filter(Boolean);

    pageRegions.forEach((region) => {
      region.inert = isInert;
    });
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu || desktopQuery.matches) {
      return;
    }

    window.clearTimeout(state.menuCloseTimer);
    mobileMenu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
    body.classList.add("menu-open");

    window.requestAnimationFrame(() => {
      mobileMenu.classList.add("is-open");
      mobileMenu.querySelector("a")?.focus({ preventScroll: true });
    });
  };

  const closeMenu = ({ restoreFocus = false, immediate = false } = {}) => {
    if (!menuToggle || !mobileMenu) {
      return;
    }

    window.clearTimeout(state.menuCloseTimer);
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    mobileMenu.classList.remove("is-open");
    body.classList.remove("menu-open");

    const finishClose = () => {
      mobileMenu.hidden = true;
      if (restoreFocus) {
        menuToggle.focus({ preventScroll: true });
      }
    };

    if (immediate || prefersReducedMotion()) {
      finishClose();
      return;
    }

    state.menuCloseTimer = window.setTimeout(finishClose, 300);
  };

  const toggleMenu = () => {
    const isOpen = menuToggle?.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu({ restoreFocus: true });
    } else {
      openMenu();
    }
  };

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

  const updateScrollEffects = () => {
    state.scrollFrame = 0;

    const scrollTop = Math.max(window.scrollY, 0);
    const scrollableHeight = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const progress = Math.min(scrollTop / scrollableHeight, 1);

    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    header?.classList.toggle("is-scrolled", scrollTop > 18);

    if (prefersReducedMotion() || !parallaxQuery.matches) {
      parallaxElements.forEach((element) => {
        element.style.setProperty("--parallax-y", "0px");
      });
      return;
    }

    const viewportCenter = window.innerHeight / 2;

    parallaxElements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      if (rect.bottom < -180 || rect.top > window.innerHeight + 180) {
        return;
      }

      const elementCenter = rect.top + rect.height / 2;
      const distance = viewportCenter - elementCenter;
      const factor = Number.parseFloat(element.dataset.parallaxFactor || "0.03");
      const offset = Math.max(-28, Math.min(28, distance * factor));

      element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });
  };

  const requestScrollUpdate = () => {
    if (state.scrollFrame) {
      return;
    }

    state.scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  };

  const scrollToAnchor = (link, event) => {
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
    closeMenu({ immediate: true });

    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });

    try {
      history.replaceState(null, "", targetId);
    } catch {
      window.location.hash = targetId;
    }
  };

  const initializeNavigationObserver = () => {
    const sections = ["inicio", "servicos", "trabalhos", "contato"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!("IntersectionObserver" in window) || !sections.length) {
      return;
    }

    state.navigationObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const currentSection = visibleEntries[0]?.target;
        if (currentSection?.id) {
          setCurrentNavigation(currentSection.id);
        }
      },
      {
        rootMargin: "-30% 0px -58%",
        threshold: [0, 0.15, 0.4, 0.65]
      }
    );

    sections.forEach((section) => state.navigationObserver.observe(section));
  };

  const applyStaggerDelays = () => {
    document.querySelectorAll(SELECTORS.staggerGroup).forEach((group) => {
      const animatedChildren = [...group.children].filter((child) =>
        child.classList.contains("reveal")
      );

      animatedChildren.forEach((element, index) => {
        const delay = Math.min(index * 85, 340);
        element.style.setProperty("--reveal-delay", `${delay}ms`);
      });
    });
  };

  const revealAll = () => {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  };

  const initializeRevealObserver = () => {
    applyStaggerDelays();

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    state.revealObserver?.disconnect();
    state.revealObserver = new IntersectionObserver(
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
        rootMargin: "0px 0px -48px"
      }
    );

    revealElements.forEach((element) => {
      if (!element.classList.contains("is-visible")) {
        state.revealObserver.observe(element);
      }
    });
  };

  const openModal = (button) => {
    if (!modal || !modalImage || !modalCaption || !modalContent) {
      return;
    }

    window.clearTimeout(state.modalCloseTimer);
    state.lastFocusedElement = document.activeElement;

    modalImage.src = button.dataset.galleryImage || "";
    modalImage.alt =
      button.dataset.galleryAlt ||
      "Imagem ampliada de um trabalho da Gabi Nails";
    modalCaption.textContent =
      button.dataset.galleryCaption || "Trabalho da Gabi Nails";

    modal.hidden = false;
    setPageInert(true);
    body.classList.add("modal-open");

    window.requestAnimationFrame(() => {
      modal.classList.add("is-open");
      modalContent.focus({ preventScroll: true });
    });
  };

  const closeModal = ({ immediate = false } = {}) => {
    if (!modal || modal.hidden) {
      return;
    }

    window.clearTimeout(state.modalCloseTimer);
    modal.classList.remove("is-open");
    body.classList.remove("modal-open");

    const finishClose = () => {
      modal.hidden = true;
      modalImage?.removeAttribute("src");
      setPageInert(false);

      if (state.lastFocusedElement instanceof HTMLElement) {
        state.lastFocusedElement.focus({ preventScroll: true });
      }
    };

    if (immediate || prefersReducedMotion()) {
      finishClose();
      return;
    }

    state.modalCloseTimer = window.setTimeout(finishClose, 330);
  };

  const trapModalFocus = (event) => {
    if (event.key !== "Tab" || !modal || modal.hidden) {
      return;
    }

    const focusableElements = getFocusableElements(modal);
    if (!focusableElements.length) {
      event.preventDefault();
      modalContent?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (event.shiftKey && document.activeElement === modalContent) {
      event.preventDefault();
      lastElement?.focus();
    } else if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const initializePointerGlow = () => {
    if (!finePointerQuery.matches) {
      return;
    }

    const cards = document.querySelectorAll(
      ".service-card, .info-card, .experience-card"
    );

    cards.forEach((card) => {
      card.addEventListener(
        "pointermove",
        (event) => {
          const rect = card.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;

          card.style.setProperty("--pointer-x", `${x.toFixed(1)}%`);
          card.style.setProperty("--pointer-y", `${y.toFixed(1)}%`);
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "50%");
      });
    });
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      if (modal && !modal.hidden) {
        closeModal();
        return;
      }

      if (menuToggle?.getAttribute("aria-expanded") === "true") {
        closeMenu({ restoreFocus: true });
      }
    }

    trapModalFocus(event);
  };

  const handleDocumentClick = (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (
      mobileMenu &&
      !mobileMenu.hidden &&
      menuToggle &&
      !mobileMenu.contains(target) &&
      !menuToggle.contains(target)
    ) {
      closeMenu();
    }
  };

  const handleMotionPreferenceChange = () => {
    if (prefersReducedMotion()) {
      state.revealObserver?.disconnect();
      revealAll();
      parallaxElements.forEach((element) => {
        element.style.setProperty("--parallax-y", "0px");
      });
    } else {
      initializeRevealObserver();
    }

    requestScrollUpdate();
  };

  const bindEvents = () => {
    menuToggle?.addEventListener("click", toggleMenu);

    mobileMenu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu({ immediate: true }));
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => scrollToAnchor(link, event));
    });

    galleryButtons.forEach((button) => {
      button.addEventListener("click", () => openModal(button));
    });

    modal?.querySelectorAll("[data-modal-close]").forEach((element) => {
      element.addEventListener("click", () => closeModal());
    });

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("pageshow", requestScrollUpdate);

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches) {
        closeMenu({ immediate: true });
      }
    });

    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
  };

  const initialize = () => {
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    initializeNavigationObserver();
    initializeRevealObserver();
    initializePointerGlow();
    bindEvents();
    updateScrollEffects();
  };

  initialize();
})();
