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
                if (matches.length > 0) {
                    DataStore._set(DataStore.KEYS.MATCHES, matches);
                }
            }
            if (playersResp.ok) {
                const serverPlayers = await playersResp.json();
                // Merge: keep local players that aren't on server (avoid data loss on server restart)
                const localPlayers = DataStore.getPlayers();
                if (serverPlayers.length > 0) {
                    const serverIds = new Set(serverPlayers.map(p => p.id));
                    const localOnly = localPlayers.filter(p => !serverIds.has(p.id));
                    DataStore._set(DataStore.KEYS.PLAYERS, [...serverPlayers, ...localOnly]);
                }
                // If server returned empty, keep local data as-is
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
          <button class="btn btn-sm btn-primary" onclick="App.navigate('register')">Crează-ți cont</button>
        `;
            }
        }

        // Update bottom nav active state
        const bottomItems = document.querySelectorAll('.bottom-nav-item');
        bottomItems.forEach(item => {
            const page = item.getAttribute('data-page');
            item.classList.toggle('active', page === this.currentPage);
        });

        // Update bottom nav profile button
        const profileBtn = document.getElementById('bottom-nav-profile');
        if (profileBtn && currentUser) {
            profileBtn.setAttribute('onclick', `App.navigate('profile', '${currentUser.id}')`);
            profileBtn.setAttribute('data-page', 'profile');
            profileBtn.querySelector('.bottom-nav-icon').textContent = currentUser.avatar || '👤';
            profileBtn.querySelector('.bottom-nav-label').textContent = 'Profil';
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

        if (match.ageCategory && currentUser.ageCategory && match.ageCategory !== currentUser.ageCategory) {
            const ageName = match.ageCategory === '5-7' ? '5–7 ani' : '7–12 ani';
            return Components.toast(`Acest meci este pentru categoria ${ageName}. Tu ești în altă categorie!`, 'error');
        }

        // Show fee confirmation modal with team selection
        const feeAmount = match.fee || 0;
        const dateStr = new Date(match.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
        const halfMax = Math.floor(match.maxPlayers / 2);
        const t1Count = (match.team1 || []).length;
        const t2Count = (match.team2 || []).length;
        const t1Players = (match.team1 || []).map(id => DataStore.getPlayer(id)).filter(Boolean);
        const t2Players = (match.team2 || []).map(id => DataStore.getPlayer(id)).filter(Boolean);

        Components.showModal('Confirmă Înscrierea ⚽', `
          <div style="text-align:center;padding:var(--space-md) 0;">
            <h3 style="margin:0 0 var(--space-sm) 0;">${match.title}</h3>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">
              📅 ${dateStr} • 🕐 ${match.time}<br>
              📍 ${match.location}, ${match.city}
            </p>

            <p style="font-weight:600;margin-bottom:var(--space-md);">Alege echipa ta:</p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg);">
              <div id="team-btn-1" onclick="App._selectedTeam=1;document.getElementById('team-btn-1').style.borderColor='var(--green-400)';document.getElementById('team-btn-2').style.borderColor='var(--border-subtle)';" 
                style="padding:var(--space-md);border-radius:var(--radius-md);background:var(--bg-input);border:2px solid var(--green-400);cursor:pointer;transition:all 0.2s;">
                <div style="font-size:1.5rem;">🔵</div>
                <div style="font-weight:700;margin:4px 0;">Echipa 1</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${t1Count}/${halfMax} jucători</div>
                ${t1Players.length > 0 ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">${t1Players.map(p => p.name.split(' ')[0]).join(', ')}</div>` : ''}
              </div>
              <div id="team-btn-2" onclick="App._selectedTeam=2;document.getElementById('team-btn-2').style.borderColor='var(--green-400)';document.getElementById('team-btn-1').style.borderColor='var(--border-subtle)';" 
                style="padding:var(--space-md);border-radius:var(--radius-md);background:var(--bg-input);border:2px solid var(--border-subtle);cursor:pointer;transition:all 0.2s;">
                <div style="font-size:1.5rem;">🔴</div>
                <div style="font-weight:700;margin:4px 0;">Echipa 2</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${t2Count}/${halfMax} jucători</div>
                ${t2Players.length > 0 ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">${t2Players.map(p => p.name.split(' ')[0]).join(', ')}</div>` : ''}
              </div>
            </div>

            ${feeAmount > 0 ? `
              <div class="fee-confirmation-box">
                <div class="fee-label">Taxă de Înscriere</div>
                <div class="fee-amount">${feeAmount} RON</div>
              </div>
            ` : `
              <div class="fee-confirmation-box fee-free">
                <div class="fee-amount">GRATUIT 🎉</div>
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

        // Default to team 1
        this._selectedTeam = 1;
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
                body: JSON.stringify({ matchId, playerId: currentUser.id, team: this._selectedTeam || 1 }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.error || 'Eroare la procesarea cererii');
            }

            if (data.free) {
                // Free match — server already added the player
                match.players.push(currentUser.id);
                const teamKey = this._selectedTeam === 1 ? 'team1' : 'team2';
                if (!match[teamKey]) match[teamKey] = [];
                match[teamKey].push(currentUser.id);
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
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">Introdu datele tale:</p>
      <div class="form-group">
        <label class="form-label">Numele tău</label>
        <input class="form-input" type="text" id="login-name" placeholder="ex: Andrei Popescu" autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">Adresa de Email 📧</label>
        <input class="form-input" type="email" id="login-email" placeholder="ex: andrei@gmail.com" autocomplete="email">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Adaugă emailul ca să primești notificări despre meciuri</div>
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
            const email = document.getElementById('login-email')?.value?.trim() || '';
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password, email }),
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
