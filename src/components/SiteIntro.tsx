import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSiteContent } from "../cms/SiteContent";
import { canUseMotion } from "../utils/motion";

export default function SiteIntro() {
  const { content } = useSiteContent();
  const introRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(canUseMotion);

  useLayoutEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    document.body.style.overflow = "hidden";

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      document.body.style.overflow = "";
      setVisible(false);
    };

    const timeline = gsap.timeline({
      onComplete: dismiss,
    });
    timeline
      .fromTo(".site-intro-logo", { opacity: 0, scale: .82 }, { opacity: 1, scale: 1, duration: .55, ease: "power3.out" })
      .fromTo(".site-intro-name", { opacity: 0, y: 16, letterSpacing: ".34em" }, { opacity: 1, y: 0, letterSpacing: ".2em", duration: .6, ease: "power3.out" }, "-=.3")
      .fromTo(".site-intro-line", { scaleX: 0 }, { scaleX: 1, duration: .55, ease: "power2.inOut" }, "-=.3")
      .to(".site-intro-content", { opacity: 0, y: -12, duration: .3, ease: "power2.in" }, "+=.12")
      .to(intro, { clipPath: "inset(0 0 100% 0)", duration: .75, ease: "power4.inOut" });

    // Nunca deixa a introducao bloquear o site caso a aba ou o motor de
    // animacao seja pausado pelo navegador.
    const fallback = window.setTimeout(dismiss, 3500);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && timeline.progress() < 1) dismiss();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(fallback);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      timeline.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;
  return <div className="site-intro" ref={introRef} aria-hidden="true">
    <div className="site-intro-content">
      <img className="site-intro-logo" src={content.brand.symbol} alt="" />
      <p className="site-intro-name">{content.brand.name} {content.brand.suffix}</p>
      <span className="site-intro-line" />
    </div>
  </div>;
}
