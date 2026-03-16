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
          <div class="profile-header animate-in">
            <div style="flex-shrink:0;">
              ${Components.playerCard(player)}
            </div>
            <div style="flex:1;padding-top:var(--space-md);">
              <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm);">
                <h1 style="margin:0;">${player.name}</h1>
                ${isOwn ? '<span style="font-size:0.75rem;padding:4px 10px;border-radius:var(--radius-full);background:rgba(34,197,94,0.15);color:var(--green-400);border:1px solid rgba(34,197,94,0.3);">Profilul Tău</span>' : ''}
              </div>
              <p style="font-size:1rem;margin-bottom:var(--space-lg);">
                ${player.positionName} • 📍 ${player.city} • ${tier.icon} ${tier.name}
              </p>

              <!-- Stats Cards -->
              <div class="profile-stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${player.elo}</div>
                  <div class="stat-label">Rating ELO</div>
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

              <!-- Radar Chart -->
              <div style="margin-top:var(--space-xl);display:flex;align-items:center;gap:var(--space-2xl);flex-wrap:wrap;">
                <div>
                  <h4 style="margin-bottom:var(--space-md);color:var(--text-secondary);">Statistici Detaliate</h4>
                  ${Components.radarChart(player.technique || 3, player.fairPlay || 3, player.fitness || 3, 200)}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--space-md);">
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
            const statusText = m.status === 'completed' ? 'Finalizat' : m.status === 'open' ? 'Deschis' : 'Complet';
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
};
