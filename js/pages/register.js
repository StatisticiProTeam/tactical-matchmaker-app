// ============================================
// Registration Page
// ============================================

const RegisterPage = {
    state: {
        step: 1,
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        city: '',
        ageCategory: '',
        position: '',
        level: '',
        photo: '',
        remember: true,
    },

    avatarOptions: ['⚡', '🔥', '🎯', '🛡️', '🧤', '💎', '🚀', '🌟', '⭐', '🦁', '🏃', '🧱', '🎖️', '👑', '🦅', '💪'],

    render() {
        const { step } = this.state;

        return `
      <div class="page-content">
        <div class="container" style="max-width: 600px;">
          <!-- Progress -->
          <div style="display:flex;gap:4px;margin-bottom:var(--space-2xl);">
            ${[1, 2, 3, 4].map(s => `
              <div style="flex:1;height:4px;border-radius:2px;background:${s <= step ? 'var(--green-500)' : 'var(--bg-input)'};transition:all 0.3s;"></div>
            `).join('')}
          </div>

          <div class="card" style="animation: fadeInUp 0.4s ease;">
            ${step === 1 ? this.renderStep1() : ''}
            ${step === 2 ? this.renderStep2() : ''}
            ${step === 3 ? this.renderStep3() : ''}
            ${step === 4 ? this.renderStep4() : ''}
          </div>
        </div>
      </div>
    `;
    },

    renderStep1() {
        return `
      <h2 style="margin-bottom:var(--space-sm);">Bine ai venit! 👋</h2>
      <p style="margin-bottom:var(--space-xl);">Să începem cu datele tale de bază.</p>

      <div class="form-group">
        <label class="form-label">Numele tău complet</label>
        <input class="form-input" type="text" id="reg-name" placeholder="ex: Andrei Popescu"
          value="${this.state.name}" oninput="RegisterPage.state.name = this.value">
      </div>

      <div class="form-group">
        <label class="form-label">Adresa de Email 📧</label>
        <input class="form-input" type="email" id="reg-email" placeholder="ex: andrei@gmail.com"
          value="${this.state.email}" oninput="RegisterPage.state.email = this.value">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Vei primi notificări despre meciuri noi în orașul tău</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
        <div class="form-group">
          <label class="form-label">Parola 🔒</label>
          <input class="form-input" type="password" id="reg-password" placeholder="Minim 4 caractere"
            value="${this.state.password}" oninput="RegisterPage.state.password = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Confirmă Parola</label>
          <input class="form-input" type="password" id="reg-confirm" placeholder="Repetă parola"
            value="${this.state.confirmPassword}" oninput="RegisterPage.state.confirmPassword = this.value">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Orașul</label>
        <select class="form-select" id="reg-city" onchange="RegisterPage.state.city = this.value">
          <option value="">— Alege orașul —</option>
          ${['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Sibiu', 'Oradea', 'Craiova', 'Galați'].map(c =>
            `<option value="${c}" ${this.state.city === c ? 'selected' : ''}>${c}</option>`
        ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Categoria de vârstă 🎂</label>
        <select class="form-select" id="reg-age" onchange="RegisterPage.state.ageCategory = this.value">
          <option value="">— Alege categoria —</option>
          <option value="5-7" ${this.state.ageCategory === '5-7' ? 'selected' : ''}>5 – 7 ani 🌟</option>
          <option value="7-12" ${this.state.ageCategory === '7-12' ? 'selected' : ''}>7 – 12 ani ⚽</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Poza ta de profil 📷</label>
        <div onclick="document.getElementById('reg-photo-input').click()"
          style="width:120px;height:120px;border-radius:50%;background:var(--bg-input);display:flex;align-items:center;justify-content:center;cursor:pointer;border:3px dashed ${this.state.photo ? 'var(--green-400)' : 'var(--border-subtle)'};transition:all 0.3s;overflow:hidden;margin:0 auto;">
          ${this.state.photo
            ? `<img src="${this.state.photo}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="text-align:center;color:var(--text-muted);">
                <div style="font-size:2rem;">📷</div>
                <div style="font-size:0.7rem;margin-top:4px;">Apasă aici</div>
              </div>`
          }
        </div>
        <input type="file" id="reg-photo-input" accept="image/*" style="display:none;"
          onchange="RegisterPage.selectPhoto(this)">
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--space-xl);">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem;color:var(--text-secondary);">
          <input type="checkbox" id="reg-remember" ${this.state.remember ? 'checked' : ''}
            onchange="RegisterPage.state.remember = this.checked"
            style="width:18px;height:18px;accent-color:var(--green-500);cursor:pointer;">
          Ține-mă minte 🔒
        </label>
        <button class="btn btn-primary" onclick="RegisterPage.nextStep()">Continuă →</button>
      </div>
    `;
    },

    renderStep2() {
        const positions = [
            { id: 'GK', name: 'Portar', icon: '🧤', desc: 'Ultima linie de apărare' },
            { id: 'DEF', name: 'Fundaș', icon: '🛡️', desc: 'Soliditate în apărare' },
            { id: 'MID', name: 'Mijlocaș', icon: '🎯', desc: 'Motor în centru' },
            { id: 'ATK', name: 'Atacant', icon: '⚡', desc: 'Foamea de gol' },
        ];

        return `
      <h2 style="margin-bottom:var(--space-sm);">Poziția ta pe teren ⚽</h2>
      <p style="margin-bottom:var(--space-xl);">Alege poziția principală pe care o joci.</p>

      <div class="position-grid">
        ${positions.map(pos => `
          <div class="position-option ${this.state.position === pos.id ? 'selected' : ''}"
            onclick="RegisterPage.selectPosition('${pos.id}', '${pos.name}')">
            <div class="pos-icon">${pos.icon}</div>
            <div class="pos-name">${pos.name}</div>
            <div class="pos-desc">${pos.desc}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:var(--space-xl);">
        <button class="btn btn-secondary" onclick="RegisterPage.prevStep()">← Înapoi</button>
        <button class="btn btn-primary" onclick="RegisterPage.nextStep()">Continuă →</button>
      </div>
    `;
    },

    renderStep3() {
        const levels = [
            { id: 'beginner', name: 'Începător', elo: 800, desc: 'Joc ocazional, mă distrez', icon: '🌱' },
            { id: 'intermediate', name: 'Intermediar', elo: 1100, desc: 'Joc regulat, am experiență', icon: '⚽' },
            { id: 'advanced', name: 'Avansat', elo: 1300, desc: 'Joc competitiv, am antrenament', icon: '🔥' },
            { id: 'expert', name: 'Expert', elo: 1500, desc: 'Am jucat în competiții/ligi', icon: '💎' },
        ];

        return `
      <h2 style="margin-bottom:var(--space-sm);">Nivelul tău 📊</h2>
      <p style="margin-bottom:var(--space-xl);">Evaluează-ți sincer nivelul. ELO-ul va fi ajustat în timp de coechipierii tăi.</p>

      <div style="display:grid;gap:var(--space-md);">
        ${levels.map(l => `
          <div class="position-option ${this.state.level === l.id ? 'selected' : ''}"
            onclick="RegisterPage.selectLevel('${l.id}')"
            style="text-align:left;display:flex;align-items:center;gap:var(--space-md);padding:var(--space-md) var(--space-lg);">
            <div style="font-size:2rem;">${l.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:600;">${l.name}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">${l.desc}</div>
            </div>
            <div style="font-family:var(--font-heading);font-weight:700;color:var(--green-400);">${l.elo}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:var(--space-xl);">
        <button class="btn btn-secondary" onclick="RegisterPage.prevStep()">← Înapoi</button>
        <button class="btn btn-primary" onclick="RegisterPage.nextStep()">Continuă →</button>
      </div>
    `;
    },

    renderStep4() {
        const tier = ELO.getTier(ELO.getInitialElo(this.state.level));
        const elo = ELO.getInitialElo(this.state.level);
        const posNames = { GK: 'Portar', DEF: 'Fundaș', MID: 'Mijlocaș', ATK: 'Atacant' };

        const previewPlayer = {
            id: 'preview',
            name: this.state.name || 'Numele Tău',
            city: this.state.city || 'Orașul Tău',
            position: this.state.position || 'MID',
            positionName: posNames[this.state.position] || 'Mijlocaș',
            elo: elo,
            technique: 3.0,
            fairPlay: 3.0,
            fitness: 3.0,
            avatar: this.state.photo ? '' : '⚽',
            photo: this.state.photo || '',
        };

        return `
      <h2 style="margin-bottom:var(--space-sm);">Cardul tău este gata! 🎉</h2>
      <p style="margin-bottom:var(--space-xl);">Așa va arăta cardul tău de jucător. Statisticile vor fi actualizate după fiecare meci.</p>

      <div style="display:flex;justify-content:center;margin-bottom:var(--space-xl);">
        ${Components.playerCard(previewPlayer)}
      </div>

      <div style="background:var(--bg-input);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-lg);">
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
          <span style="color:var(--text-muted);">Jucător</span>
          <span>${this.state.name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
          <span style="color:var(--text-muted);">Oraș</span>
          <span>${this.state.city}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
          <span style="color:var(--text-muted);">Poziție</span>
          <span>${posNames[this.state.position] || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
          <span style="color:var(--text-muted);">Categorie vârstă</span>
          <span>${this.state.ageCategory === '5-7' ? '5 – 7 ani 🌟' : '7 – 12 ani ⚽'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
          <span style="color:var(--text-muted);">ELO Inițial</span>
          <span style="color:var(--green-400);font-weight:700;">${elo} (${tier.name} ${tier.icon})</span>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;">
        <button class="btn btn-secondary" onclick="RegisterPage.prevStep()">← Înapoi</button>
        <button class="btn btn-primary btn-lg" onclick="RegisterPage.submit()">✅ Finalizează Înscrierea</button>
      </div>
    `;
    },

    selectPhoto(input) {
        const file = input.files[0];
        if (!file) return;

        // Max 500KB
        if (file.size > 500 * 1024) {
            Components.toast('Poza e prea mare! Maxim 500KB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Resize to 200x200 for storage
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                // Crop to square from center
                const size = Math.min(img.width, img.height);
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
                RegisterPage.state.photo = canvas.toDataURL('image/jpeg', 0.7);
                App.renderPage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    selectPosition(id, name) {
        this.state.position = id;
        this.state.positionName = name;
        App.renderPage();
    },

    selectLevel(level) {
        this.state.level = level;
        App.renderPage();
    },

    nextStep() {
        const { step, name, city, position, level, avatar, password, confirmPassword, ageCategory } = this.state;
        if (step === 1) {
            if (!name.trim()) return Components.toast('Introdu-ți numele!', 'error');
            if (!this.state.email || !this.state.email.includes('@')) return Components.toast('Introdu o adresă de email validă!', 'error');
            if (!password || password.length < 4) return Components.toast('Parola trebuie să aibă minim 4 caractere!', 'error');
            if (password !== confirmPassword) return Components.toast('Parolele nu coincid!', 'error');
            if (!city) return Components.toast('Alege orașul!', 'error');
            if (!ageCategory) return Components.toast('Alege categoria de vârstă!', 'error');
        }
        if (step === 2 && !position) return Components.toast('Alege o poziție!', 'error');
        if (step === 3 && !level) return Components.toast('Alege nivelul tău!', 'error');

        this.state.step = Math.min(4, step + 1);
        App.renderPage();
    },

    prevStep() {
        this.state.step = Math.max(1, this.state.step - 1);
        App.renderPage();
    },

    async submit() {
        const { name, password, city, position, level, avatar } = this.state;
        const posNames = { GK: 'Portar', DEF: 'Fundaș', MID: 'Mijlocaș', ATK: 'Atacant' };

        // Disable button
        const btn = document.querySelector('.btn-primary.btn-lg');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Se creează contul...'; }

        try {
            const resp = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: this.state.email.trim(),
                    password,
                    city,
                    ageCategory: this.state.ageCategory,
                    position,
                    positionName: posNames[position],
                    level,
                    photo: this.state.photo || '',
                }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                Components.toast(data.error || 'Eroare la înregistrare', 'error');
                if (btn) { btn.disabled = false; btn.textContent = '✅ Finalizează Înscrierea'; }
                return;
            }

            // Save locally and login
            DataStore.savePlayer(data);
            DataStore.setCurrentUser(data.id, this.state.remember);

            // Reset form
            this.state = { step: 1, name: '', email: '', password: '', confirmPassword: '', city: '', ageCategory: '', position: '', level: '', photo: '', remember: true };

            Components.toast(`Bine ai venit, ${data.name}! 🎉`, 'success');
            App.navigate('profile', data.id);
        } catch (err) {
            Components.toast('Eroare de conexiune. Încearcă din nou.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = '✅ Finalizează Înscrierea'; }
        }
    },
};
