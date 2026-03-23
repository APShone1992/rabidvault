.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-w);
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1.4rem 1.2rem 1rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sidebar-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}

.sidebar-brand {
  font-family: 'Creepster', cursive;
  font-size: 1rem;
  letter-spacing: 0.12em;
  color: var(--purple-light);
  text-shadow: 0 0 14px rgba(139,92,246,0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sidebar-nav::-webkit-scrollbar { width: 3px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: var(--subtle); border-radius: 2px; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(139,92,246,0.1);
  color: var(--text);
}

.nav-item.active {
  background: rgba(139,92,246,0.18);
  color: var(--purple-light);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--purple);
  box-shadow: 0 0 8px rgba(139,92,246,0.6);
}

.nav-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-section-label {
  font-family: var(--font-ui);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--subtle);
  padding: 0.85rem 0.85rem 0.25rem;
  margin-top: 0.25rem;
}

.sidebar-footer {
  padding: 0.85rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.65rem;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple-dark), var(--purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  border: 1.5px solid var(--border-strong);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-family: var(--font-ui);
  font-size: 0.68rem;
  color: var(--muted);
  margin-top: 1px;
}

.xp-bar-track {
  height: 4px;
  background: var(--bg3);
  border-radius: 2px;
  overflow: hidden;
  margin: 0.4rem 0 0.25rem;
}

.xp-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--purple), var(--purple-light));
  transition: width 0.6s ease;
}

.xp-label {
  font-family: var(--font-ui);
  font-size: 0.6rem;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.65rem;
}

.sidebar-footer-actions {
  display: flex;
  gap: 0.4rem;
}

.sidebar-footer-label {
  font-family: var(--font-ui);
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--subtle);
  text-align: center;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
