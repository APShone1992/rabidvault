.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 8000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(6px);
  animation: cp-fade-in 0.3s ease;
}

.onboarding-modal {
  background: var(--card);
  border: 1px solid var(--border-strong);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(139,92,246,0.2),
    0 32px 80px rgba(0,0,0,0.7);
  animation: cp-slide-in 0.3s cubic-bezier(0.34,1.2,0.64,1);
}

.onboarding-close {
  position: absolute;
  top: 1rem; right: 1rem;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--muted);
  font-size: 0.75rem;
  transition: all 0.15s;
}
.onboarding-close:hover { background: var(--red); color: #fff; border-color: var(--red); }

.onboarding-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.onboarding-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 12px rgba(139,92,246,0.4);
  margin-bottom: 0.4rem;
}

.onboarding-sub {
  color: var(--muted);
  font-size: 0.9rem;
  font-style: italic;
}

.onboarding-steps {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-bottom: 1.75rem;
}

.onboarding-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.onboarding-step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--purple);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.onboarding-step-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.onboarding-step-body { flex: 1; }

.onboarding-step-title {
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  letter-spacing: 0.02em;
}

.onboarding-step-text {
  font-size: 0.84rem;
  color: var(--muted);
  line-height: 1.5;
}

.onboarding-actions { text-align: center; }
