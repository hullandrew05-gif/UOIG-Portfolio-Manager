// Login gate. Shown when /api/auth/me returns 401.
// Defines window.AB_LOGIN = { LoginGate }.

(function () {
  const { useState } = React;

  const styles = {
    gate: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      background: "#faf6ee",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: 380,
      background: "#fff",
      border: "1px solid #e8e2d4",
      borderRadius: 14,
      padding: "36px 32px",
      boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 12px 32px -16px rgba(0,0,0,.12)",
    },
    title: {
      fontFamily: "'Fraunces', Georgia, serif",
      fontSize: 28,
      fontWeight: 600,
      margin: "0 0 4px",
      color: "#2b2418",
    },
    sub: {
      fontSize: 14,
      color: "#7a6f5c",
      margin: "0 0 24px",
    },
    google: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      width: "100%",
      padding: "11px 14px",
      border: "1px solid #d9d2c2",
      borderRadius: 10,
      background: "#fff",
      color: "#2b2418",
      fontSize: 14,
      fontWeight: 500,
      textDecoration: "none",
      cursor: "pointer",
      transition: "background .15s",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "20px 0",
      color: "#a89c84",
      fontSize: 12,
      letterSpacing: ".08em",
      textTransform: "uppercase",
    },
    dividerLine: { flex: 1, height: 1, background: "#e8e2d4" },
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 500,
      color: "#5c5240",
      marginBottom: 6,
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #d9d2c2",
      borderRadius: 10,
      fontSize: 14,
      fontFamily: "inherit",
      background: "#fdfaf3",
      color: "#2b2418",
      outline: "none",
      boxSizing: "border-box",
    },
    field: { marginBottom: 14 },
    error: {
      background: "#fde8e3",
      color: "#a8341c",
      padding: "10px 12px",
      borderRadius: 10,
      fontSize: 13,
      marginBottom: 12,
    },
    submit: {
      width: "100%",
      padding: "11px 14px",
      border: "none",
      borderRadius: 10,
      background: "#c25a3a",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    },
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.95-2.18l-2.9-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );

  function LoginGate({ onAuth }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(e) {
      e.preventDefault();
      setError("");
      setBusy(true);
      try {
        const resp = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          setError(j.error || `Sign-in failed (${resp.status})`);
          setBusy(false);
          return;
        }
        if (onAuth) onAuth();
      } catch (err) {
        setError(String(err.message || err));
        setBusy(false);
      }
    }

    return (
      <div style={styles.gate}>
        <div style={styles.card}>
          <h1 style={styles.title}>Andrew Brain</h1>
          <p style={styles.sub}>Sign in to continue</p>

          <a href="/api/auth/google/start" style={styles.google}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </a>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span>or</span>
            <div style={styles.dividerLine} />
          </div>

          <form onSubmit={submit}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="ab-email">Email</label>
              <input
                id="ab-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="ab-pw">Password</label>
              <input
                id="ab-pw"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" style={styles.submit} disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  window.AB_LOGIN = { LoginGate };
})();
