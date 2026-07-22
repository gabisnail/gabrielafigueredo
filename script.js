(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileMenuLinks = mobileMenu
    ? mobileMenu.querySelectorAll("a")
    : [];

  const yearElement = document.querySelector("#current-year");
  const modal = document.querySelector("#gallery-modal");
  const modalImage = document.querySelector("#gallery-modal-image");
  const modalCaption = document.querySelector("#gallery-modal-caption");
  const modalCloseButton = modal?.querySelector(".gallery-modal-close");
  const galleryButtons = document.querySelectorAll("[data-gallery-image]");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let lastFocusedElement = null;

  const setMenuState = (isOpen) => {
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
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    setMenuState(!isOpen);
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setMenuState(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileMenu || mobileMenu.hidden || !menuToggle) {
      return;
    }

    const clickedInsideMenu = mobileMenu.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

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
    header?.classList.toggle(
      "is-scrolled",
      window.scrollY > 18
    );
  };

  updateHeader();

  window.addEventListener("scroll", updateHeader, {
    passive: true
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });

      if (history.pushState) {
        try {
          history.pushState(null, "", targetId);
        } catch (error) {
          window.location.hash = targetId;
        }
      }
    });
  });

  if (yearElement) {
    yearElement.textContent = String(
      new Date().getFullYear()
    );
  }

  const getFocusableElements = (container) => {
    return [
      ...container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ].filter((element) => !element.hasAttribute("hidden"));
  };

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
      button.dataset.galleryCaption ||
      "Trabalho da Gabi Nails";

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
    button.addEventListener("click", () => {
      openModal(button);
    });
  });

  modal
    ?.querySelectorAll("[data-modal-close]")
    .forEach((element) => {
      element.addEventListener("click", closeModal);
    });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal && !modal.hidden) {
        closeModal();
        return;
      }

      if (
        menuToggle?.getAttribute("aria-expanded") === "true"
      ) {
        setMenuState(false);
        menuToggle.focus();
      }
    }

    if (
      event.key === "Tab" &&
      modal &&
      !modal.hidden
    ) {
      const focusableElements =
        getFocusableElements(modal);

      if (!focusableElements.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });

  const revealElements =
    document.querySelectorAll(".reveal");

  if (
    reduceMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
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

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  }
})();