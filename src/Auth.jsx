import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseclient";

/* CertWolf brand */
const BRAND_DARK = "#111d2a";   // deep navy
const BRAND_BLUE = "#1a73e8";   // accent/link
const BRAND_BG   = "#FAFAFA";   // page background
const LOGO_URL   = "https://i.imgur.com/WqdkIGU.png";

/* Animated dot-connection background */
function NetworkBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const opts = {
      count: 90,
      maxDist: 140,
      speed: 0.35,
      radius: 1.7,
      lineAlpha: 0.14,
      dotAlpha: 0.8,
      color: "#ffffff",
      lineColor: "#ffffff",
    };

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      buildParticles();
    };

    const rand = (min, max) => Math.random() * (max - min) + min;

    function buildParticles() {
      const w = canvas.width, h = canvas.height;
      particlesRef.current = Array.from({ length: opts.count }).map(() => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-opts.speed, opts.speed),
        vy: rand(-opts.speed, opts.speed),
      }));
    }

    function tick() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= w) p.vx *= -1;
        if (p.y <= 0 || p.y >= h) p.vy *= -1;
      }

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const maxD2 = opts.maxDist * opts.maxDist * (window.devicePixelRatio || 1);
          if (d2 < maxD2) {
            const t = 1 - d2 / maxD2;
            ctx.globalAlpha = opts.lineAlpha * t;
            ctx.strokeStyle = opts.lineColor;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = opts.color;
      for (const p of particlesRef.current) {
        ctx.globalAlpha = opts.dotAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, opts.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, background: BRAND_DARK }}
    />
  );
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setMsg("");
    setLoading(true);

    const redirectUrl = import.meta.env.DEV
      ? "http://localhost:5173/auth/callback"
      : "https://regal-gecko-30e2a8.netlify.app/auth/callback";
    console.log("redirect used:", redirectUrl);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    console.log("signUp:", data, error);
    setLoading(false);
    setMsg(error ? error.message : "Check your email to confirm.");
  };

  const signIn = async () => {
    setMsg("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "Logged in.");
  };

  return (
    <div className="min-h-screen relative" style={{ background: BRAND_BG }}>
      {/* animated background */}
      <NetworkBackground />

      {/* auth card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white/95 backdrop-blur p-6 shadow">
          {/* header with logo + brand color */}
          <div className="mb-4 flex items-center gap-3">
            <img src={LOGO_URL} alt="CertWolf" className="h-9 w-9" />
            <h1 className="text-xl font-semibold" style={{ color: BRAND_DARK }}>
              Sign in to CertWolf Study Hub
            </h1>
          </div>

          <label className="text-sm text-gray-600">Email</label>
          <input
            className="mb-3 mt-1 w-full rounded-xl border p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className="text-sm text-gray-600">Password</label>
          <input
            className="mb-4 mt-1 w-full rounded-xl border p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          <div className="flex gap-2">
            <button
              onClick={signIn}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-white"
              style={{ background: BRAND_DARK }}
            >
              {loading ? "…" : "Sign in"}
            </button>

            <button
              onClick={signUp}
              disabled={loading}
              className="rounded-xl px-4 py-2 border"
              style={{ borderColor: BRAND_DARK, color: BRAND_DARK }}
            >
              Create account
            </button>
          </div>

          {msg && (
            <div className="mt-3 text-sm" style={{ color: BRAND_DARK }}>
              {msg}
            </div>
          )}

          {/* optional helper link colorized */}
          <div className="mt-4 text-xs">
            <a href="/reset" style={{ color: BRAND_BLUE }}>
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
