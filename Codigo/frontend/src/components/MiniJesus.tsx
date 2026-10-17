import React, { useEffect, useRef, useState } from "react";
import "./MiniJesus.css";

type Mood = "walk" | "wave" | "flee" | "look";

const SIZE = 56;
const SPEED_WALK = 55;
const SPEED_FLEE = 160;
const LOOK_RADIUS = 120;
const FLEE_RADIUS = 70;

/**
 * Mini Jesus decorativo que caminha pela base da tela e reage ao mouse.
 * Não interfere em cliques da página (pointer-events só no personagem).
 */
const MiniJesus: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const stateRef = useRef({
    x: 40,
    y: 0,
    dir: 1 as 1 | -1,
    mood: "walk" as Mood,
    moodUntil: 0,
    reduced: false,
  });
  const [facing, setFacing] = useState<1 | -1>(1);
  const [mood, setMood] = useState<Mood>("walk");
  const [bubble, setBubble] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => {
      stateRef.current.reduced = mq.matches;
      if (mq.matches) setHidden(true);
      else setHidden(false);
    };
    syncReduced();
    mq.addEventListener("change", syncReduced);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let last = performance.now();
    let lastUi = 0;

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (stateRef.current.reduced) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const el = wrapRef.current;
      if (!el) return;

      const st = stateRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const groundY = vh - SIZE - 12;
      st.y = groundY;

      const cx = st.x + SIZE / 2;
      const cy = st.y + SIZE / 2;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dist = Math.hypot(mx - cx, my - cy);

      if (now > st.moodUntil) {
        if (dist < FLEE_RADIUS) {
          st.mood = "flee";
          st.moodUntil = now + 900;
          st.dir = mx < cx ? 1 : -1;
        } else if (dist < LOOK_RADIUS) {
          st.mood = "look";
          st.moodUntil = now + 400;
          st.dir = mx >= cx ? 1 : -1;
        } else if (st.mood !== "walk") {
          st.mood = "walk";
        }
      }

      let speed = SPEED_WALK;
      if (st.mood === "flee") speed = SPEED_FLEE;
      if (st.mood === "look" || st.mood === "wave") speed = 0;

      st.x += st.dir * speed * dt;

      const margin = 8;
      if (st.x < margin) {
        st.x = margin;
        st.dir = 1;
      } else if (st.x > vw - SIZE - margin) {
        st.x = vw - SIZE - margin;
        st.dir = -1;
      }

      el.style.transform = `translate3d(${st.x}px, ${st.y}px, 0)`;

      if (now - lastUi > 80) {
        lastUi = now;
        setFacing(st.dir);
        setMood(st.mood);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      mq.removeEventListener("change", syncReduced);
    };
  }, []);

  const handleClick = () => {
    const st = stateRef.current;
    st.mood = "wave";
    st.moodUntil = performance.now() + 1400;
    setMood("wave");
    const phrases = ["Paz!", "Eu estou contigo", "Segue-me", "Ânimo!"];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    window.setTimeout(() => setBubble(null), 1400);
  };

  if (hidden) return null;

  return (
    <div
      className="mini-jesus-layer"
      aria-hidden="true"
    >
      <div
        ref={wrapRef}
        className={`mini-jesus mini-jesus--${mood} ${facing === -1 ? "mini-jesus--flip" : ""}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        role="presentation"
        title="Clique no mini Jesus"
      >
        {bubble && <span className="mini-jesus__bubble">{bubble}</span>}
        <svg
          className="mini-jesus__svg"
          viewBox="0 0 64 64"
          width={SIZE}
          height={SIZE}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* halo */}
          <ellipse className="mini-jesus__halo" cx="32" cy="10" rx="14" ry="5" />
          {/* body / robe */}
          <path
            className="mini-jesus__robe"
            d="M22 28c2 2 6 3 10 3s8-1 10-3l4 26c-4 3-10 5-14 5s-10-2-14-5l4-26z"
          />
          <path
            className="mini-jesus__sash"
            d="M24 40h16l-1 4H25z"
          />
          {/* head */}
          <circle className="mini-jesus__skin" cx="32" cy="20" r="9" />
          {/* hair */}
          <path
            className="mini-jesus__hair"
            d="M23 18c0-7 4-11 9-11s9 4 9 11c-2-3-5-4-9-4s-7 1-9 4z"
          />
          <path
            className="mini-jesus__beard"
            d="M25 24c2 5 5 7 7 7s5-2 7-7c-2 1-4 2-7 2s-5-1-7-2z"
          />
          {/* eyes */}
          <circle cx="28.5" cy="20" r="1.2" fill="#2b2f30" />
          <circle cx="35.5" cy="20" r="1.2" fill="#2b2f30" />
          {/* smile */}
          <path
            d="M28 24c1.5 1.5 6.5 1.5 8 0"
            fill="none"
            stroke="#8b5a3c"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* left arm */}
          <g className="mini-jesus__arm mini-jesus__arm--l">
            <path
              d="M22 30c-4 4-6 10-5 12"
              fill="none"
              stroke="#c6865a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          {/* right arm */}
          <g className="mini-jesus__arm mini-jesus__arm--r">
            <path
              d="M42 30c4 4 6 10 5 12"
              fill="none"
              stroke="#c6865a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          {/* legs */}
          <g className="mini-jesus__leg mini-jesus__leg--l">
            <path
              d="M28 52v8"
              fill="none"
              stroke="#c6865a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <g className="mini-jesus__leg mini-jesus__leg--r">
            <path
              d="M36 52v8"
              fill="none"
              stroke="#c6865a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MiniJesus;
