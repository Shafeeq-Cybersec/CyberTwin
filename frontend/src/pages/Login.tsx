import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/** Login page — dark, centered card with the CyberTwin brand. */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid credentials or backend unreachable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,#131a2b,#0a0e17)]">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 shadow-glow mb-4">
            <Shield className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-wide">
            Cyber<span className="text-accent">Twin</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cyber Digital Twin Platform</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="analyst@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Authenticating…" : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail("analyst@company.com");
              setPassword("admin123");
            }}
            className="w-full text-xs text-accent hover:underline py-1 text-center"
          >
            Quick Fill Demo Credentials
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized personnel only. For instant demo access, any credentials will work.
        </p>
      </div>
    </div>
  );
}
