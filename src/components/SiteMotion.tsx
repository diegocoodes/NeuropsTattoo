import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SiteMotion() {
  useLayoutEffect(() => {
    if (navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const matchMedia = gsap.matchMedia();
    matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".navbar", { yPercent: -100 }, { yPercent: 0, duration: .7, delay: 1.15, ease: "power3.out" });
      gsap.fromTo(".whatsapp-float", { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: .55, delay: 1.75, ease: "back.out(1.5)" });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 42 }, {
          opacity: 1,
          y: 0,
          duration: .85,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = group.querySelectorAll("[data-reveal-item]");
        gsap.fromTo(items, { opacity: 0, y: 36 }, {
          opacity: 1,
          y: 0,
          duration: .75,
          stagger: .1,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        });
      });

      const cleanups: Array<() => void> = [];
      if (window.matchMedia("(pointer: fine)").matches) {
        gsap.utils.toArray<HTMLElement>(".btn, .nav-action").forEach((button) => {
          const move = (event: PointerEvent) => {
            const bounds = button.getBoundingClientRect();
            gsap.to(button, {
              x: (event.clientX - bounds.left - bounds.width / 2) * .12,
              y: (event.clientY - bounds.top - bounds.height / 2) * .12,
              duration: .35,
              ease: "power2.out",
            });
          };
          const leave = () => gsap.to(button, { x: 0, y: 0, duration: .55, ease: "elastic.out(1, .45)" });
          button.addEventListener("pointermove", move);
          button.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            button.removeEventListener("pointermove", move);
            button.removeEventListener("pointerleave", leave);
          });
        });
      }
      return () => cleanups.forEach((cleanup) => cleanup());
    });

    return () => matchMedia.revert();
  }, []);

  return null;
}
