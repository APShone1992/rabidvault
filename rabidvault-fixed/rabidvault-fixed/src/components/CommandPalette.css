.cp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 9000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  backdrop-filter: blur(4px);
  animation: cp-fade-in 0.15s ease;
}

@keyframes cp-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.cp-modal {
  background: var(--bg2);
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  box-shadow:
    0 0 0 1px rgba(139,92,246,0.2),
    0 32px 80px rgba(0,0,0,0.7),
    0 0 60px rgba(109,40,217,0.15);
  overflow: hidden;
  animation: cp-slide-in 0.2s cubic-bezier(0.34,1.3,0.64,1);
}

@keyframes cp-slide-in {
  from { opacity: 0; transform: scale(0.96) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.cp-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.cp-search-icon {
  font-size: 1rem;
  flex-shrink: 0;
  opacity: 0.6;
}

.cp-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.cp-input::placeholder {
  color: var(--muted);
  font-weight: 400;
}

.cp-kbd {
  font-family: var(--font-ui);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 7px;
  flex-shrink: 0;
}

.cp-section-label {
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0.6rem 1.25rem 0.3rem;
}

.cp-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 0.25rem 0.5rem 0.5rem;
}

.cp-list::-webkit-scrollbar { width: 4px; }
.cp-list::-webkit-scrollbar-thumb { background: var(--subtle); border-radius: 2px; }

.cp-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
  color: var(--text);
}

.cp-item.active,
.cp-item:hover {
  background: rgba(139,92,246,0.12);
}

.cp-item-icon {
  width: 34px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--bg3);
  border-radius: 6px;
  overflow: hidden;
}

.cp-item-body {
  flex: 1;
  min-width: 0;
}

.cp-item-label {
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-item-sub {
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-ui);
}

.cp-item-type {
  font-family: var(--font-ui);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--subtle);
  flex-shrink: 0;
}

.cp-footer {
  display: flex;
  gap: 1.25rem;
  padding: 0.65rem 1.25rem;
  border-top: 1px solid var(--border);
  font-family: var(--font-ui);
  font-size: 0.7rem;
  color: var(--muted);
}

.cp-footer kbd {
  display: inline-block;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.65rem;
  margin-right: 3px;
}

@media (max-width: 600px) {
  .cp-overlay { padding-top: 0; align-items: flex-end; }
  .cp-modal   { border-radius: 16px 16px 0 0; max-width: 100%; }
}
