// ============================================
// Main Application — Router & Core Logic
// ============================================

const App = {
    currentPage: 'home',
    currentParam: null,

    async init() {
        // Handle hash routing
        window.addEventListener('hashchange', () => this.handleRoute());

        // Initialize rating page listeners
        RatePage.init();

        // Sync data from server to localStorage
        await this.syncFromServer();

        // Render initial page
        this.handleRoute();
    },

    async syncFromServer() {
        try {
            const [matchesResp, playersResp] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/players'),
            ]);
            if (matchesResp.ok) {
                const matches = await matchesResp.json();
                DataStore._set(DataStore.KEYS.MATCHES, matches);
            }
            if (playersResp.ok) {
                const players = await playersResp.json();
                DataStore._set(DataStore.KEYS.PLAYERS, players);
            }
        } catch (e) {
            console.warn('Server sync failed, using local data:', e.message);
        }
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const parts = hash.split('/');
        this.currentPage = parts[0];
        this.currentParam = parts[1] || null;
        this.renderPage();
    },

    navigate(page, param) {
        if (param) {
            window.location.hash = `${page}/${param}`;
        } else {
            window.location.hash = page;
        }
    },

    renderPage() {
        const appContent = document.getElementById('app-content');
        if (!appContent) return;

        let html = '';
        switch (this.currentPage) {
            case 'home':
                html = LandingPage.render();
                break;
            case 'register':
                html = RegisterPage.render();
                break;
            case 'profile':
                html = ProfilePage.render(this.currentParam);
                break;
            case 'matches':
                html = MatchesPage.render();
                break;
            case 'rate':
                RatePage.state.submitted = false;
                html = RatePage.render(this.currentParam);
                break;
            default:
                html = LandingPage.render();
        }

        appContent.innerHTML = html;
        this.updateNav();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateNav() {
        const currentUser = DataStore.getCurrentUser();
        const userArea = document.getElementById('nav-user-area');
        const links = document.querySelectorAll('.navbar-links a');

        // Update active link
        links.forEach(link => {
            const href = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('active', href === this.currentPage);
        });

        // Update user area
        if (userArea) {
            if (currentUser) {
                const tier = ELO.getTier(currentUser.elo);
                userArea.innerHTML = `
          <span style="font-size:0.8rem;color:var(--text-muted);">${currentUser.elo} ELO</span>
          <div class="user-avatar" onclick="App.navigate('profile', '${currentUser.id}')"
            title="${currentUser.name}" style="background:${tier.color}22;border-color:${tier.color}66;">
            ${currentUser.avatar || '⚽'}
          </div>
          <button class="btn btn-sm btn-secondary" onclick="App.logout()" title="Deconectare">🚪</button>
        `;
            } else {
                userArea.innerHTML = `
          <button class="btn btn-sm btn-secondary" onclick="App.showLoginModal()">Intră în Cont</button>
          <button class="btn btn-sm btn-primary" onclick="App.navigate('register')">Înscrie-te</button>
        `;
            }
        }
    },

    joinMatch(matchId) {
        const currentUser = DataStore.getCurrentUser();
        if (!currentUser) {
            Components.toast('Trebuie să fii autentificat!', 'error');
            return this.showLoginModal();
        }

        const match = DataStore.getMatch(matchId);
        if (!match) return Components.toast('Meci negăsit!', 'error');

        if (match.players.includes(currentUser.id)) {
            return Components.toast('Ești deja în acest meci!', 'info');
        }

        if (match.players.length >= match.maxPlayers) {
            return Components.toast('Meciul este plin!', 'error');
        }

        if (currentUser.elo < match.eloMin || currentUser.elo > match.eloMax) {
            return Components.toast(`ELO-ul tău (${currentUser.elo}) nu este în range-ul meciului (${match.eloMin}-${match.eloMax})!`, 'error');
        }

        // Show fee confirmation modal
        const feeAmount = match.fee || 0;
        const dateStr = new Date(match.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

        Components.showModal('Confirmare Înscriere ⚽', `
          <div style="text-align:center;padding:var(--space-md) 0;">
            <div style="font-size:2.5rem;margin-bottom:var(--space-md);">⚽</div>
            <h3 style="margin:0 0 var(--space-sm) 0;">${match.title}</h3>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">
              📅 ${dateStr} • 🕐 ${match.time}<br>
              📍 ${match.location}, ${match.city}
            </p>

            ${feeAmount > 0 ? `
              <div class="fee-confirmation-box">
                <div class="fee-label">Taxă de Înscriere</div>
                <div class="fee-amount">${feeAmount} RON</div>
                <div class="fee-description">Include închirierea terenului și arbitrajul</div>
              </div>
            ` : `
              <div class="fee-confirmation-box fee-free">
                <div class="fee-amount">GRATUIT 🎉</div>
                <div class="fee-description">Acest meci nu are taxă de înscriere</div>
              </div>
            `}

            <div style="display:flex;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);">
              <button class="btn btn-secondary" onclick="Components.closeModal()">Anulează</button>
              <button class="btn btn-primary" onclick="App.confirmJoinMatch('${matchId}')">
                💳 Confirm ${feeAmount > 0 ? `și Plătesc ${feeAmount} RON` : 'Înscrierea'}
              </button>
            </div>
          </div>
        `);
    },

    async confirmJoinMatch(matchId) {
        const currentUser = DataStore.getCurrentUser();
        if (!currentUser) return;

        const match = DataStore.getMatch(matchId);
        if (!match) return;

        // Disable button to prevent double-clicks
        const btn = document.querySelector('.modal .btn-primary');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Se procesează...';
        }

        try {
            const resp = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, playerId: currentUser.id }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.error || 'Eroare la procesarea cererii');
            }

            if (data.free) {
                // Free match — server already added the player
                // Update local data too
                match.players.push(currentUser.id);
                if (match.players.length >= match.maxPlayers) match.status = 'full';
                DataStore.saveMatch(match);

                Components.closeModal();
                Components.toast(`Ai intrat în meciul "${match.title}"! ⚽`, 'success');
                this.renderPage();
            } else if (data.url) {
                // Paid match — redirect to Stripe Checkout
                Components.closeModal();
                Components.toast('Redirecționare către pagina de plată...', 'info');
                window.location.href = data.url;
            }
        } catch (err) {
            Components.toast(err.message || 'Eroare la înscriere', 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '💳 Reîncearcă';
            }
        }
    },

    showLoginModal() {
        const players = DataStore.getPlayers();

        Components.showModal('Intră în Cont 🔑', `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Selectează profilul tău din lista de jucători:</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm);max-height:400px;overflow-y:auto;">
        ${players.map(p => {
            const tier = ELO.getTier(p.elo);
            return `
            <div onclick="App.loginAs('${p.id}')"
              style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md);border-radius:var(--radius-md);background:var(--bg-input);cursor:pointer;border:1px solid var(--border-subtle);transition:all 0.2s;"
              onmouseover="this.style.borderColor='var(--green-400)'"
              onmouseout="this.style.borderColor='var(--border-subtle)'">
              <div style="font-size:1.5rem;">${p.avatar || '⚽'}</div>
              <div style="flex:1;">
                <div style="font-weight:600;">${p.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${p.positionName || p.position} • ${p.city}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;color:${tier.color};">${p.elo}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">${tier.icon} ${tier.name}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `);
    },

    loginAs(playerId) {
        DataStore.setCurrentUser(playerId);
        const player = DataStore.getPlayer(playerId);
        Components.closeModal();
        Components.toast(`Bine ai revenit, ${player?.name}! 👋`, 'success');
        this.renderPage();
    },

    logout() {
        DataStore.logout();
        Components.toast('Te-ai deconectat. La revedere! 👋', 'info');
        this.navigate('home');
    },

    toggleMobileMenu() {
        const menu = document.querySelector('.navbar-links');
        if (menu) menu.classList.toggle('show');
    },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
