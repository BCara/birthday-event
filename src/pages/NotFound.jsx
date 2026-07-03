import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes floatBalloon {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-24px) rotate(5deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nf-balloon {
          display: inline-block;
          font-size: 90px;
          animation: floatBalloon 3s ease-in-out infinite;
          filter: drop-shadow(0 12px 24px rgba(255, 107, 107, 0.3));
        }
        .nf-content {
          animation: fadeInUp 0.6s ease both;
        }
        .nf-content > * {
          animation: fadeInUp 0.6s ease both;
        }
        .nf-content > *:nth-child(2) { animation-delay: 0.1s; }
        .nf-content > *:nth-child(3) { animation-delay: 0.2s; }
        .nf-content > *:nth-child(4) { animation-delay: 0.3s; }
        .nf-content > *:nth-child(5) { animation-delay: 0.4s; }
      `}</style>

      <div style={styles.root}>
        <div style={styles.content} className="nf-content">
          <div className="nf-balloon">🎈</div>

          <h1 style={styles.code}>404</h1>

          <h2 style={styles.heading}>Oops! This party doesn't exist.</h2>

          <p style={styles.body}>
            Looks like someone popped this balloon. The page you're looking for
            has floated away or never existed.
          </p>

          <Link to="/" className="kb-btn kb-btn-primary" style={styles.btn}>
            🏠 Back to Home
          </Link>
        </div>

        {/* Decorative confetti dots */}
        <div style={styles.confetti} aria-hidden="true">
          {confettiItems.map((item, i) => (
            <div key={i} style={{ ...styles.dot, ...item }} />
          ))}
        </div>
      </div>
    </>
  );
}

const confettiItems = [
  { width: 10, height: 10, background: 'var(--kb-coral)', top: '15%', left: '10%', borderRadius: '50%', opacity: 0.5 },
  { width: 14, height: 14, background: 'var(--kb-yellow)', top: '25%', right: '12%', borderRadius: 3, opacity: 0.5 },
  { width: 8, height: 8, background: 'var(--kb-mint)', top: '60%', left: '8%', borderRadius: '50%', opacity: 0.4 },
  { width: 12, height: 12, background: 'var(--kb-purple)', top: '70%', right: '15%', borderRadius: '50%', opacity: 0.45 },
  { width: 6, height: 6, background: 'var(--kb-coral)', top: '80%', left: '20%', borderRadius: '50%', opacity: 0.35 },
  { width: 16, height: 16, background: 'var(--kb-yellow)', bottom: '20%', right: '8%', borderRadius: 4, opacity: 0.4 },
  { width: 9, height: 9, background: 'var(--kb-mint)', top: '10%', right: '25%', borderRadius: '50%', opacity: 0.3 },
  { width: 11, height: 11, background: 'var(--kb-purple)', bottom: '30%', left: '15%', borderRadius: '50%', opacity: 0.4 },
];

const styles = {
  root: {
    minHeight: '100vh',
    background: 'var(--kb-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 520,
    position: 'relative',
    zIndex: 1,
    gap: 16,
  },
  code: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 'clamp(80px, 18vw, 140px)',
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    background: 'linear-gradient(135deg, var(--kb-coral) 0%, var(--kb-yellow) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heading: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 'clamp(20px, 4vw, 28px)',
    fontWeight: 600,
    color: 'var(--kb-text)',
    margin: 0,
  },
  body: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 16,
    color: 'var(--kb-text-muted)',
    lineHeight: 1.7,
    maxWidth: 380,
    margin: 0,
  },
  btn: {
    marginTop: 8,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  confetti: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  dot: {
    position: 'absolute',
  },
};
