import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../firebase';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      trackEvent('sign_up', { method: 'google' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
      toast.error('Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      trackEvent('sign_up', { method: 'email' });
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.message || 'Sign-up failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <SEO
        title="Sign Up"
        description="Create an account to start planning unforgettable birthday parties with Tiny Party Portal."
        url="https://tinypartyportal.com/signup"
        noindex
      />
      <div style={styles.card} className="kb-card">
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>🎂</span>
          <span style={styles.logoText}>Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></span>
        </div>

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Start planning unforgettable parties</p>

        {/* Google Sign-Up */}
        <button
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          style={styles.googleBtn}
          className="kb-btn"
        >
          {googleLoading ? (
            <span style={styles.spinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.2-4.4 5.5l6.2 5.2c-.4.4 6.9-5 6.9-14.7 0-1.3-.1-2.6-.4-3.9z" />
            </svg>
          )}
          <span style={{ marginLeft: 10 }}>{googleLoading ? 'Signing up…' : 'Sign up with Google'}</span>
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="kb-field">
            <label className="kb-label" htmlFor="signup-name">Your Name</label>
            <input
              id="signup-name"
              type="text"
              className="kb-input"
              placeholder="e.g. Sarah Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="kb-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="kb-input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="kb-btn kb-btn-primary"
            style={styles.submitBtn}
          >
            {loading ? <span style={styles.spinner} /> : null}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.switchLink}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'var(--kb-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: 'var(--kb-surface)',
    border: '1px solid var(--kb-border)',
    borderRadius: 24,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 30,
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--kb-coral), var(--kb-yellow))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  title: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--kb-text)',
    textAlign: 'center',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 14,
    color: 'var(--kb-text-muted)',
    textAlign: 'center',
    margin: '0 0 28px 0',
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    background: 'var(--kb-surface-2)',
    border: '1px solid var(--kb-border)',
    borderRadius: 12,
    padding: '12px 20px',
    color: 'var(--kb-text)',
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    marginBottom: 20,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--kb-border)',
  },
  dividerText: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  error: {
    background: 'rgba(255,107,107,0.12)',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: 10,
    padding: '10px 14px',
    color: 'var(--kb-coral)',
    fontFamily: 'var(--kb-font-body)',
    fontSize: 13,
    margin: 0,
  },
  submitBtn: {
    width: '100%',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchLink: {
    textAlign: 'center',
    fontFamily: 'var(--kb-font-body)',
    fontSize: 14,
    color: 'var(--kb-text-muted)',
    marginTop: 24,
    marginBottom: 0,
  },
  link: {
    color: 'var(--kb-coral)',
    textDecoration: 'none',
    fontWeight: 600,
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid var(--kb-border)',
    borderTopColor: 'var(--kb-text)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};
