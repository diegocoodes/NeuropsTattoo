import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { canUseMotion, hasFinePointer } from "../utils/motion";

gsap.registerPlugin(ScrollTrigger);

export default function SiteMotion() {
  useLayoutEffect(() => {
    if (!canUseMotion()) return;

    const matchMedia = gsap.matchMedia();
    matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".navbar", { yPercent: -100 }, { yPercent: 0, duration: .7, delay: 1.15, ease: "power3.out" });
      gsap.fromTo(".whatsapp-float", { scale: .86 }, { scale: 1, duration: .55, delay: 1.75, ease: "back.out(1.5)" });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(element, { y: 42 }, {
          y: 0,
          duration: .85,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = group.querySelectorAll("[data-reveal-item]");
        gsap.fromTo(items, { y: 36 }, {
          y: 0,
          duration: .75,
          stagger: .1,
          ease: "power3.out",
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        });
      });

      const cleanups: Array<() => void> = [];
      if (hasFinePointer()) {
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
