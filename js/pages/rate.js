// ============================================
// Rate Players Page (Post-Match)
// ============================================

const RatePage = {
    state: {
        matchId: null,
        ratings: {}, // { playerId: { technique, fairPlay, fitness } }
        submitted: false,
    },

    render(matchId) {
        this.state.matchId = matchId;
        const currentUser = DataStore.getCurrentUser();
        const match = DataStore.getMatch(matchId);

        if (!currentUser) {
            return `
        <div class="page-content container">
          ${Components.emptyState('🔐', 'Trebuie să fii autentificat', 'Intră în cont pentru a evalua jucătorii.',
                `<button class="btn btn-primary" onclick="App.showLoginModal()">Intră în Cont</button>`
            )}
        </div>
      `;
        }

        if (!match) {
            return `
        <div class="page-content container">
          ${Components.emptyState('🤷', 'Meci negăsit', 'Nu am putut găsi acest meci.',
                `<button class="btn btn-primary" onclick="App.navigate('matches')">Vezi Meciuri</button>`
            )}
        </div>
      `;
        }

        if (this.state.submitted) {
            return `
        <div class="page-content container">
          <div class="card" style="text-align:center;padding:var(--space-3xl);">
            <div style="font-size:4rem;margin-bottom:var(--space-lg);">🎉</div>
            <h2>Evaluările au fost trimise!</h2>
            <p style="margin-top:var(--space-md);margin-bottom:var(--space-xl);">Rating-urile OVR au fost actualizate. Mulțumim!</p>
            <div style="display:flex;gap:var(--space-md);justify-content:center;">
              <button class="btn btn-secondary" onclick="App.navigate('matches')">Înapoi la Meciuri</button>
              <button class="btn btn-primary" onclick="App.navigate('profile', '${currentUser.id}')">Vezi Profilul Meu</button>
            </div>
          </div>
        </div>
      `;
        }

        const otherPlayers = (match.players || [])
            .filter(id => id !== currentUser.id)
            .map(id => DataStore.getPlayer(id))
            .filter(Boolean);

        if (otherPlayers.length === 0) {
            return `
        <div class="page-content container">
          ${Components.emptyState('👥', 'Niciun jucător de evaluat', 'Nu există alți jucători în acest meci.',
                `<button class="btn btn-primary" onclick="App.navigate('matches')">Înapoi la Meciuri</button>`
            )}
        </div>
      `;
        }

        return `
      <div class="page-content">
        <div class="container">
          <div class="animate-in">
            <h1 style="margin-bottom:var(--space-sm);">Evaluează Jucătorii ⭐</h1>
            <p style="margin-bottom:var(--space-xs);">${match.title}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-2xl);">
              📅 ${new Date(match.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })} • 📍 ${match.location}
            </p>
          </div>

          <div class="rate-players-list">
            ${otherPlayers.map((p, i) => {
            const alreadyRated = DataStore.hasRated(matchId, currentUser.id, p.id);
            const tier = ELO.getTier(p.elo);

            return `
                <div class="rate-player-card animate-in animate-delay-${i + 1}" ${alreadyRated ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                  ${alreadyRated ? '<div style="text-align:center;font-size:0.8rem;color:var(--green-400);margin-bottom:var(--space-sm);">✅ Deja evaluat</div>' : ''}
                  <div class="rate-player-header">
                    <div class="rate-player-avatar" style="font-size:1.5rem;">${p.avatar || '⚽'}</div>
                    <div>
                      <div style="font-weight:600;">${p.name}</div>
                      <div style="font-size:0.8rem;color:var(--text-muted);">${p.positionName || p.position} • ${tier.icon} ${p.elo} OVR</div>
                    </div>
                  </div>

                  <div class="rate-category">
                    <div class="rate-label">
                      <span>⚡ Tehnică</span>
                      <span class="rate-value" id="val-${p.id}-technique">—</span>
                    </div>
                    ${Components.starRating(p.id, 'technique')}
                  </div>

                  <div class="rate-category">
                    <div class="rate-label">
                      <span>🤝 Fair-Play</span>
                      <span class="rate-value" id="val-${p.id}-fairPlay">—</span>
                    </div>
                    ${Components.starRating(p.id, 'fairPlay')}
                  </div>

                  <div class="rate-category">
                    <div class="rate-label">
                      <span>🏃 Condiție Fizică</span>
                      <span class="rate-value" id="val-${p.id}-fitness">—</span>
                    </div>
                    ${Components.starRating(p.id, 'fitness')}
                  </div>
                </div>
              `;
        }).join('')}
          </div>

          <div style="text-align:center;margin-top:var(--space-2xl);" class="animate-in">
            <button class="btn btn-primary btn-lg" onclick="RatePage.submitRatings()">
              📤 Trimite Evaluările
            </button>
          </div>
        </div>
      </div>
    `;
    },

    init() {
        // Listen for star rating changes
        document.addEventListener('change', (e) => {
            if (e.target.closest('.star-rating')) {
                const rating = e.target.closest('.star-rating');
                const name = rating.dataset.name;
                const category = rating.dataset.category;
                const value = parseInt(e.target.value);

                if (!this.state.ratings[name]) {
                    this.state.ratings[name] = {};
                }
                this.state.ratings[name][category] = value;

                // Update display
                const valEl = document.getElementById(`val-${name}-${category}`);
                if (valEl) valEl.textContent = value + '/5';
            }
        });
    },

    submitRatings() {
        const currentUser = DataStore.getCurrentUser();
        const match = DataStore.getMatch(this.state.matchId);
        if (!currentUser || !match) return;

        const otherPlayers = (match.players || [])
            .filter(id => id !== currentUser.id)
            .map(id => DataStore.getPlayer(id))
            .filter(Boolean);

        let allRated = true;
        let ratingCount = 0;

        otherPlayers.forEach(p => {
            const r = this.state.ratings[p.id];
            if (!r || !r.technique || !r.fairPlay || !r.fitness) {
                allRated = false;
            } else {
                ratingCount++;
            }
        });

        if (ratingCount === 0) {
            return Components.toast('Evaluează cel puțin un jucător!', 'error');
        }

        // Save ratings and update ELOs
        otherPlayers.forEach(p => {
            const r = this.state.ratings[p.id];
            if (!r || !r.technique || !r.fairPlay || !r.fitness) return;
            if (DataStore.hasRated(this.state.matchId, currentUser.id, p.id)) return;

            DataStore.addRating({
                id: DataStore.generateId(),
                matchId: this.state.matchId,
                raterId: currentUser.id,
                targetId: p.id,
                technique: r.technique,
                fairPlay: r.fairPlay,
                fitness: r.fitness,
                createdAt: new Date().toISOString(),
            });

            // Recalculate player stats from all ratings
            const allRatings = DataStore.getRatingsForPlayer(p.id);
            ELO.updatePlayerElo(p, allRatings);
        });

        this.state.submitted = true;
        this.state.ratings = {};
        Components.toast(`${ratingCount} evaluări trimise cu succes!`, 'success');
        App.renderPage();
    },
};
