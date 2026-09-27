/* =========================================================
   ST. AGNES EDUCATIONAL CENTRE
   Website interactions
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       DARK MODE
    ========================================= */

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const savedTheme = localStorage.getItem("st-agnes-theme");

    /* Load saved theme */

    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");

        if (themeIcon) {
            themeIcon.textContent = "☀️";
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                "Switch to light mode"
            );

            themeToggle.setAttribute(
                "title",
                "Switch to light mode"
            );
        }
    }

    /* Toggle theme */

    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            themeToggle.classList.add("changing");

            setTimeout(() => {

                const isDark =
                    document.documentElement.getAttribute("data-theme") === "dark";

                if (isDark) {

                    /* Switch to light mode */

                    document.documentElement.removeAttribute("data-theme");

                    localStorage.setItem(
                        "st-agnes-theme",
                        "light"
                    );

                    if (themeIcon) {
                        themeIcon.textContent = "🌙";
                    }

                    themeToggle.setAttribute(
                        "aria-label",
                        "Switch to dark mode"
                    );

                    themeToggle.setAttribute(
                        "title",
                        "Switch to dark mode"
                    );

                } else {

                    /* Switch to dark mode */

                    document.documentElement.setAttribute(
                        "data-theme",
                        "dark"
                    );

                    localStorage.setItem(
                        "st-agnes-theme",
                        "dark"
                    );

                    if (themeIcon) {
                        themeIcon.textContent = "☀️";
                    }

                    themeToggle.setAttribute(
                        "aria-label",
                        "Switch to light mode"
                    );

                    themeToggle.setAttribute(
                        "title",
                        "Switch to light mode"
                    );
                }

                themeToggle.classList.remove("changing");

            }, 150);

        });

    }


    /* =========================================
       LEARN MORE SELECTOR
    ========================================= */

    const learnMoreBtn =
        document.getElementById("learnMoreBtn");

    const learnMoreMenu =
        document.getElementById("learnMoreMenu");

    if (learnMoreBtn && learnMoreMenu) {

        learnMoreBtn.addEventListener("click", () => {

            const isOpen =
                learnMoreMenu.classList.toggle("open");

            learnMoreBtn.classList.toggle(
                "open",
                isOpen
            );

            learnMoreBtn.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            learnMoreMenu.setAttribute(
                "aria-hidden",
                String(!isOpen)
            );

        });


        /* Close when clicking outside */

        document.addEventListener("click", (event) => {

            if (
                !learnMoreBtn.contains(event.target) &&
                !learnMoreMenu.contains(event.target)
            ) {

                learnMoreMenu.classList.remove("open");

                learnMoreBtn.classList.remove("open");

                learnMoreBtn.setAttribute(
                    "aria-expanded",
                    "false"
                );

                learnMoreMenu.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }

        });


        /* Close with Escape — only when the menu is open */

        document.addEventListener("keydown", (event) => {

            if (event.key !== "Escape") {
                return;
            }

            if (!learnMoreMenu.classList.contains("open")) {
                return;
            }

            learnMoreMenu.classList.remove("open");

            learnMoreBtn.classList.remove("open");

            learnMoreBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            learnMoreMenu.setAttribute(
                "aria-hidden",
                "true"
            );

            learnMoreBtn.focus();

        });

    }


    /* =========================================
       SCROLL REVEAL
    ========================================= */

    const revealElements =
        document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach((entry) => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );

        revealElements.forEach((element) => {
            observer.observe(element);
        });

    } else {

        revealElements.forEach((element) => {
            element.classList.add("visible");
        });

    }

    /* =========================================
   MOBILE MENU
========================================= */

const mobileMenuToggle =
    document.getElementById("mobileMenuToggle");

const mainNav =
    document.getElementById("mainNav");

if (mobileMenuToggle && mainNav) {

    mobileMenuToggle.addEventListener("click", () => {

        const isOpen =
            mainNav.classList.toggle("mobile-open");

        mobileMenuToggle.classList.toggle(
            "menu-open",
            isOpen
        );

        document.body.classList.toggle(
            "menu-open",
            isOpen
        );

        mobileMenuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        mobileMenuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );

    });


    /* Close menu after selecting a page */

    mainNav.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("mobile-open");

            mobileMenuToggle.classList.remove(
                "menu-open"
            );

            document.body.classList.remove(
                "menu-open"
            );

            mobileMenuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileMenuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        });

    });


    /* Close with Escape */

    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            mainNav.classList.contains("mobile-open")
        ) {

            mainNav.classList.remove("mobile-open");

            mobileMenuToggle.classList.remove(
                "menu-open"
            );

            document.body.classList.remove(
                "menu-open"
            );

            mobileMenuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileMenuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

            mobileMenuToggle.focus();

        }

    });

}

});