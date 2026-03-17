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
                const navAvatar = currentUser.photo
                    ? `<img src="${currentUser.photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
                    : (currentUser.avatar || '⚽');
                userArea.innerHTML = `
          <span style="font-size:0.8rem;color:var(--text-muted);">${currentUser.elo} ELO</span>
          <div class="user-avatar" onclick="App.navigate('profile', '${currentUser.id}')"
            title="${currentUser.name}" style="background:${tier.color}22;border-color:${tier.color}66;">
            ${navAvatar}
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
        Components.showModal('Intră în Cont 🔑', `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Introdu numele și parola ta:</p>
      <div class="form-group">
        <label class="form-label">Numele tău</label>
        <input class="form-input" type="text" id="login-name" placeholder="ex: Andrei Popescu" autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">Parola</label>
        <input class="form-input" type="password" id="login-password" placeholder="Introdu parola" autocomplete="current-password">
      </div>
      <div id="login-error" style="color:var(--red-400);font-size:0.85rem;margin-bottom:var(--space-md);display:none;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--space-lg);">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem;color:var(--text-secondary);">
          <input type="checkbox" id="login-remember" checked style="width:18px;height:18px;accent-color:var(--green-500);cursor:pointer;">
          Ține-mă minte 🔒
        </label>
        <div style="display:flex;gap:var(--space-md);">
          <button class="btn btn-secondary" onclick="Components.closeModal()">Anulează</button>
          <button class="btn btn-primary" id="login-btn" onclick="App.login()">🔑 Intră în Cont</button>
        </div>
      </div>
    `);
        // Focus name input
        setTimeout(() => document.getElementById('login-name')?.focus(), 100);
        // Enter key support
        setTimeout(() => {
            const pwInput = document.getElementById('login-password');
            if (pwInput) pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') App.login(); });
        }, 100);
    },

    async login() {
        const nameEl = document.getElementById('login-name');
        const passEl = document.getElementById('login-password');
        const errEl = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        const name = nameEl?.value?.trim();
        const password = passEl?.value;

        if (!name || !password) {
            errEl.textContent = 'Introdu numele și parola!';
            errEl.style.display = 'block';
            return;
        }

        // Loading state
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Se verifică...'; }

        try {
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                errEl.textContent = data.error || 'Eroare la autentificare';
                errEl.style.display = 'block';
                if (btn) { btn.disabled = false; btn.textContent = '🔑 Intră în Cont'; }
                return;
            }

            // Success — save player locally and set as current user
            const remember = document.getElementById('login-remember')?.checked || false;
            DataStore.savePlayer(data);
            DataStore.setCurrentUser(data.id, remember);
            Components.closeModal();
            Components.toast(`Bine ai revenit, ${data.name}! 👋`, 'success');
            this.renderPage();
        } catch (err) {
            errEl.textContent = 'Eroare de conexiune. Încearcă din nou.';
            errEl.style.display = 'block';
            if (btn) { btn.disabled = false; btn.textContent = '🔑 Intră în Cont'; }
        }
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
