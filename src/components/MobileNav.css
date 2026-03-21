.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg2);
  border-top: 1px solid var(--border);
  z-index: 200;
  padding: 0 0.5rem;
  align-items: stretch;
  justify-content: space-around;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@media (max-width: 768px) {
  .mobile-nav { display: flex; }
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 8px 4px;
  transition: color 0.15s ease;
  position: relative;
}

.mobile-nav-item.active {
  color: var(--purple-light);
}

.mobile-nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--purple);
  border-radius: 0 0 3px 3px;
}

.mobile-nav-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.mobile-nav-label {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mobile-nav-add {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(139,92,246,0.5);
  margin-top: -14px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mobile-nav-item:active .mobile-nav-add {
  transform: scale(0.94);
  box-shadow: 0 2px 8px rgba(139,92,246,0.4);
}
