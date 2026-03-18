// ============================================
// Profile Page
// ============================================

const ProfilePage = {
    render(playerId) {
        const player = DataStore.getPlayer(playerId);
        if (!player) {
            return `
        <div class="page-content container">
          ${Components.emptyState('🤷', 'Jucător negăsit', 'Nu am putut găsi acest profil.',
                `<button class="btn btn-primary" onclick="App.navigate('home')">Acasă</button>`
            )}
        </div>
      `;
        }

        const tier = ELO.getTier(player.elo);
        const currentUser = DataStore.getCurrentUser();
        const isOwn = currentUser && currentUser.id === player.id;
        const matches = DataStore.getMatchesByPlayer(player.id);
        const ratings = DataStore.getRatingsForPlayer(player.id);

        return `
      <div class="page-content">
        <div class="container">
          <!-- Profile Header -->
          <div class="animate-in" style="text-align:center;">
            <div style="display:flex;justify-content:center;margin-bottom:var(--space-lg);">
              ${Components.playerCard(player)}
            </div>

            ${isOwn ? `<div style="display:flex;gap:var(--space-sm);justify-content:center;margin-bottom:var(--space-lg);flex-wrap:wrap;">
              <span style="font-size:0.75rem;padding:4px 12px;border-radius:var(--radius-full);background:rgba(34,197,94,0.15);color:var(--green-400);border:1px solid rgba(34,197,94,0.3);">Profilul Tău</span>
              <button class="btn btn-sm btn-secondary" onclick="ProfilePage.showEditModal('${player.id}')">✏️ Editează Contul</button>
            </div>` : ''}

            <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:var(--space-lg);">
              ${player.positionName} • 📍 ${player.city} • ${tier.icon} ${tier.name}
            </p>

            <!-- Stats Cards -->
            <div class="profile-stats-grid" style="margin-bottom:var(--space-xl);">
              <div class="stat-card">
                <div class="stat-value">${player.elo}</div>
                <div class="stat-label">Rating OVR</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${player.matchesPlayed}</div>
                <div class="stat-label">Meciuri Jucate</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" style="color:var(--gold-400);">${ratings.length}</div>
                <div class="stat-label">Evaluări Primite</div>
              </div>
            </div>

            <!-- Detailed Stats -->
            <div style="text-align:left;">
              <h4 style="margin-bottom:var(--space-md);color:var(--text-secondary);">Statistici Detaliate</h4>
              <div style="display:flex;align-items:center;gap:var(--space-xl);flex-wrap:wrap;justify-content:center;">
                <div>
                  ${Components.radarChart(player.technique || 3, player.fairPlay || 3, player.fitness || 3, 180)}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-md);flex:1;min-width:200px;">
                  ${this.statBar('⚡ Tehnică', player.technique || 3, '#22c55e')}
                  ${this.statBar('🤝 Fair-Play', player.fairPlay || 3, '#3b82f6')}
                  ${this.statBar('🏃 Condiție Fizică', player.fitness || 3, '#f59e0b')}
                </div>
              </div>
            </div>
          </div>

          <!-- Match History -->
          <div class="animate-in animate-delay-2">
            <h3 style="margin-bottom:var(--space-lg);">📋 Istoric Meciuri</h3>
            ${matches.length > 0 ? `
              <div class="history-list">
                ${matches.slice(0, 10).map(m => {
            const dateStr = new Date(m.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
            const statusClass = m.status === 'completed' ? 'badge-completed' : m.status === 'open' ? 'badge-open' : 'badge-full';
            const statusText = m.status === 'completed' ? 'Finalizat' : m.status === 'open' ? 'Viitor' : 'Complet';
            return `
                    <div class="history-item" onclick="App.navigate('matches')">
                      <div>
                        <div style="font-weight:600;font-size:0.9rem;">${m.title}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">${dateStr} • ${m.location}</div>
                      </div>
                      <div style="display:flex;align-items:center;gap:var(--space-md);">
                        <span style="font-size:0.75rem;color:var(--text-muted);">${m.players.length} jucători</span>
                        <span class="match-badge ${statusClass}">${statusText}</span>
                      </div>
                    </div>
                  `;
        }).join('')}
              </div>
            ` : Components.emptyState('📋', 'Niciun meci încă', 'Intră într-un meci pentru a-ți construi istoricul!',
            `<button class="btn btn-primary" onclick="App.navigate('matches')">Găsește un Meci</button>`
        )}
          </div>
        </div>
      </div>
    `;
    },

    statBar(label, value, color) {
        const pct = (value / 5) * 100;
        return `
      <div style="min-width:200px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:0.85rem;">${label}</span>
          <span style="font-weight:700;color:${color};">${value.toFixed(1)}</span>
        </div>
        <div style="height:6px;border-radius:3px;background:var(--bg-input);overflow:hidden;">
          <div style="height:100%;width:${pct}%;border-radius:3px;background:${color};transition:width 0.8s ease;"></div>
        </div>
      </div>
    `;
    },

    showEditModal(playerId) {
        const player = DataStore.getPlayer(playerId);
        if (!player) return;

        Components.showModal('✏️ Editează Contul', `
          <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Modifică datele contului tău:</p>
          <div class="form-group">
            <label class="form-label">Adresa de Email 📧</label>
            <input class="form-input" type="email" id="edit-email" placeholder="ex: andrei@gmail.com"
              value="${player.email || ''}">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Primești notificări la această adresă</div>
          </div>
          <div class="form-group">
            <label class="form-label">Oraș 📍</label>
            <select class="form-select" id="edit-city">
              ${['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Sibiu', 'Oradea', 'Craiova', 'Galați'].map(c =>
                `<option value="${c}" ${player.city === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <hr style="border:0;border-top:1px solid var(--border-subtle);margin:var(--space-lg) 0;">
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:var(--space-md);">🔒 Schimbă parola (lasă gol dacă nu vrei să o schimbi)</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Parola nouă</label>
              <input class="form-input" type="password" id="edit-password" placeholder="Minim 4 caractere">
            </div>
            <div class="form-group">
              <label class="form-label">Confirmă parola</label>
              <input class="form-input" type="password" id="edit-confirm" placeholder="Repetă parola">
            </div>
          </div>
          <div id="edit-error" style="color:var(--red-400);font-size:0.85rem;margin-bottom:var(--space-md);display:none;"></div>
          <div style="display:flex;justify-content:flex-end;gap:var(--space-md);margin-top:var(--space-lg);">
            <button class="btn btn-secondary" onclick="Components.closeModal()">Anulează</button>
            <button class="btn btn-primary" id="edit-save-btn" onclick="ProfilePage.saveProfile('${playerId}')">💾 Salvează</button>
          </div>
        `);
    },

    async saveProfile(playerId) {
        const email = document.getElementById('edit-email')?.value?.trim() || '';
        const city = document.getElementById('edit-city')?.value || '';
        const password = document.getElementById('edit-password')?.value || '';
        const confirm = document.getElementById('edit-confirm')?.value || '';
        const errEl = document.getElementById('edit-error');
        const btn = document.getElementById('edit-save-btn');

        if (password && password.length < 4) {
            errEl.textContent = 'Parola trebuie să aibă minim 4 caractere!';
            errEl.style.display = 'block';
            return;
        }
        if (password && password !== confirm) {
            errEl.textContent = 'Parolele nu coincid!';
            errEl.style.display = 'block';
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ Se salvează...'; }

        try {
            const resp = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, email, city, password: password || undefined }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                errEl.textContent = data.error || 'Eroare la salvare';
                errEl.style.display = 'block';
                if (btn) { btn.disabled = false; btn.textContent = '💾 Salvează'; }
                return;
            }

            DataStore.savePlayer(data);
            Components.closeModal();
            Components.toast('Contul a fost actualizat! ✅', 'success');
            App.renderPage();
        } catch (err) {
            errEl.textContent = 'Eroare de conexiune.';
            errEl.style.display = 'block';
            if (btn) { btn.disabled = false; btn.textContent = '💾 Salvează'; }
        }
    },
};
