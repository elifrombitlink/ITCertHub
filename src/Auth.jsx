import { useState } from "react";
import { supabase } from "./supabaseclient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const signUp = async () => {
setMsg("");

const redirectUrl = import.meta.env.DEV
  ? "http://localhost:5173/auth/callback"
  : "https://regal-gecko-30e2a8.netlify.app/auth/callback";
console.log("redirect used:", redirectUrl);

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectUrl
  }
});
console.log("signUp:", data, error);
setMsg(error ? error.message : "Check your email to confirm.");
  }

  const signIn = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Logged in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Sign in to IT Cert Study Hub</h1>

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
          <button onClick={signIn} className="rounded-xl bg-black px-4 py-2 text-white">Sign in</button>
          <button onClick={signUp} className="rounded-xl border px-4 py-2">Create account</button>
        </div>

        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}
