"use client";
import { useEffect } from "react";

export default function GlobalAnimations() {
    useEffect(() => {
        // ===== SCROLL-TRIGGERED REVEAL WITH STAGGER =====
        const revObs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const parent = el.parentElement;
                        const siblings = parent
                            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            [...(parent.children as any)].filter((c) => c.dataset.rev)
                            : [];
                        const idx = siblings.indexOf(el);
                        el.style.transitionDelay = (idx >= 0 ? idx * 0.1 : 0) + "s";
                        el.classList.add("revealed");
                        revObs.unobserve(el);
                    }
                });
            },
            { threshold: 0.06 }
        );

        document
            .querySelectorAll(".deal,.stat,.rev,.plan,.combo,.act-card")
            .forEach((el) => {
                const e = el as HTMLElement;
                e.dataset.rev = "1";
                e.style.opacity = "0";
                e.style.transform = "translateY(28px)";
                e.style.transition =
                    "opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)";
                revObs.observe(e);
            });

        // ===== STEPS ENTRANCE =====
        const stepsObs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const wrap = entry.target as HTMLElement;
                        const steps = wrap.querySelectorAll(".stp");
                        const arrows = wrap.querySelectorAll(".stp-arrow");
                        steps.forEach((s, i) => {
                            setTimeout(() => {
                                (s as HTMLElement).style.opacity = "1";
                                (s as HTMLElement).style.transform = "translateY(0) scale(1)";
                            }, i * 300);
                        });
                        arrows.forEach((a, i) => {
                            setTimeout(() => {
                                (a as HTMLElement).style.opacity = "1";
                            }, i * 300 + 200);
                        });
                        stepsObs.unobserve(wrap);
                    }
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll(".steps-wrap").forEach((wrap) => {
            wrap.querySelectorAll(".stp").forEach((s) => {
                (s as HTMLElement).style.opacity = "0";
                (s as HTMLElement).style.transform = "translateY(30px) scale(.95)";
                (s as HTMLElement).style.transition =
                    "opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)";
            });
            wrap.querySelectorAll(".stp-arrow").forEach((a) => {
                (a as HTMLElement).style.opacity = "0";
                (a as HTMLElement).style.transition = "opacity .5s ease";
            });
            stepsObs.observe(wrap);
        });

        // ===== PARALLAX ON HERO =====
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (y < 900) {
                        const mascot = document.querySelector(".hero-mascot") as HTMLElement;
                        const orb = document.querySelector(".hero-orb") as HTMLElement;
                        if (mascot)
                            mascot.style.transform =
                                "translateY(" + (Math.sin(Date.now() / 600) * 8 + y * 0.06) + "px)";
                        if (orb)
                            orb.style.transform =
                                "translate(-50%,calc(-50% + " +
                                y * 0.1 +
                                "px)) scale(" +
                                (1 + y * 0.0003) +
                                ")";
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener("scroll", handleScroll);

        // ===== 3D CARD TILT ON HOVER =====
        const handleCardMove = (e: Event) => {
            const me = e as MouseEvent;
            const card = e.currentTarget as HTMLElement;
            const r = card.getBoundingClientRect();
            const x = (me.clientX - r.left) / r.width - 0.5;
            const y = (me.clientY - r.top) / r.height - 0.5;
            card.style.transform =
                "translateY(-6px) perspective(800px) rotateY(" +
                x * 5 +
                "deg) rotateX(" +
                -y * 5 +
                "deg)";
            card.style.transition = "transform .08s ease";
            // Shine overlay
            let shine = card.querySelector(".card-shine") as HTMLElement;
            if (shine)
                shine.style.background =
                    "radial-gradient(circle at " +
                    (x + 0.5) * 100 +
                    "% " +
                    (y + 0.5) * 100 +
                    "%, rgba(255,255,255,.12) 0%, transparent 60%)";
        };
        const handleCardLeave = (e: Event) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "";
            card.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
            const shine = card.querySelector(".card-shine") as HTMLElement;
            if (shine) shine.style.background = "transparent";
        };

        document.querySelectorAll(".deal,.combo").forEach((card) => {
            card.addEventListener("mousemove", handleCardMove);
            card.addEventListener("mouseleave", handleCardLeave);
            // Add shine overlay element
            if (!card.querySelector(".card-shine")) {
                const shine = document.createElement("div");
                shine.className = "card-shine";
                shine.style.cssText =
                    "position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:3;transition:background .1s";
                (card as HTMLElement).style.position = "relative";
                card.appendChild(shine);
            }
        });

        // ===== MAGNETIC BUTTONS =====

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const handleBtnMove = (e: Event) => {
            const me = e as MouseEvent;
            const btn = e.currentTarget as HTMLElement;
            const r = btn.getBoundingClientRect();
            const x = me.clientX - r.left - r.width / 2;
            const y = me.clientY - r.top - r.height / 2;
            btn.style.transform =
                "translate(" + x * 0.15 + "px," + y * 0.15 + "px) translateY(-2px)";
        };
        const handleBtnLeave = (e: Event) => {
            const btn = e.currentTarget as HTMLElement;
            btn.style.transform = "";
            btn.style.transition = "transform .4s cubic-bezier(.22,1,.36,1)";
        };
        const handleBtnEnter = (e: Event) => {
            const btn = e.currentTarget as HTMLElement;
            btn.style.transition = "transform .1s ease";
        };

        document
            .querySelectorAll(".btn-search,.nav-cta,.plan-btn.fill,.cta-row button")
            .forEach((btn) => {
                btn.addEventListener("mousemove", handleBtnMove);
                btn.addEventListener("mouseleave", handleBtnLeave);
                btn.addEventListener("mouseenter", handleBtnEnter);
            });

        // ===== ANIMATED NUMBER COUNTER =====
        const cObs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const text = el.textContent || "";
                        const m = text.match(/^([\d,]+)/);
                        if (m) {
                            const target = parseInt(m[1].replace(/,/g, ""));
                            const suffix = text.replace(m[1], "");
                            const dur = 1800,
                                start = performance.now();
                            const anim = (now: number) => {
                                const p = Math.min((now - start) / dur, 1);
                                const ease = 1 - Math.pow(1 - p, 4);
                                el.textContent =
                                    Math.floor(target * ease).toLocaleString() + suffix;
                                if (p < 1) requestAnimationFrame(anim);
                            };
                            requestAnimationFrame(anim);
                        }
                        cObs.unobserve(el);
                    }
                });
            },
            { threshold: 0.5 }
        );
        document.querySelectorAll(".stat-n").forEach((el) => cObs.observe(el));

        // ===== SECTION HEADERS ENTRANCE =====
        const headerObs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("header-visible");
                        headerObs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );
        document
            .querySelectorAll(".section-header,.explorer>h2,.explorer>.tag")
            .forEach((el) => {
                const e = el as HTMLElement;
                e.style.opacity = "0";
                e.style.transform = "translateY(20px)";
                e.style.transition =
                    "opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1)";
                headerObs.observe(el);
            });

        // Revealed classes
        const s = document.createElement('style');
        s.textContent = '.revealed{opacity:1!important;transform:translateY(0)!important}.header-visible{opacity:1!important;transform:translateY(0)!important}';
        document.head.appendChild(s);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            // Clean up listeners if strict mode re-runs this, but difficult for querySelectorAll.
            // In a real app we might attach refs. For now this global approach is okay for the port.
        };
    }, []);

    return null;
}
