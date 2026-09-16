import { useRef, useEffect, type JSX } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_FROM: gsap.TweenVars = { opacity: 0, y: 40 };
const DEFAULT_TO: gsap.TweenVars = { opacity: 1, y: 0 };

export default function SplitText({
  text = "",
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars", // mantido por compatibilidade
  from = DEFAULT_FROM,
  to = DEFAULT_TO,
  threshold = 0.1, // mantido por compatibilidade
  rootMargin = "-100px", // mantido por compatibilidade
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
  showCallback = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  tag?: keyof JSX.IntrinsicElements;
  onLetterAnimationComplete?: () => void;
  showCallback?: boolean;
}) {
  const ref = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;
    if (navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // evita reanimar se já completou
    if (completedRef.current) return;

    const letters = el.querySelectorAll("[data-char]");
    if (!letters.length) return;

    const tween = gsap.fromTo(
      letters,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          once: true,
        },
        onComplete: () => {
          completedRef.current = true;
          if (showCallback && typeof onLetterAnimationComplete === "function") {
            onLetterAnimationComplete();
          }
        },
      }
    );

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [
    text,
    delay,
    duration,
    ease,
    from,
    to,
    showCallback,
    onLetterAnimationComplete,
    splitType,
    threshold,
    rootMargin,
  ]);

  const Tag = tag;

  return (
    <Tag
      ref={ref}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        overflow: "hidden",
        display: "inline-block",
        whiteSpace: "normal",
        wordWrap: "break-word",
      }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          data-char
          className="split-char"
          style={{
            display: "inline-block",
            whiteSpace: ch === " " ? "pre" : "normal",
            willChange: "transform, opacity",
          }}
        >
          {ch}
        </span>
      ))}
    </Tag>
  );
}
