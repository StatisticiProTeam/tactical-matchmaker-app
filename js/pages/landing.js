// ============================================
// Landing Page
// ============================================

const LandingPage = {
    render() {
        const topPlayers = DataStore.getTopPlayers(6);
        const currentUser = DataStore.getCurrentUser();

        return `
      <div class="page-content">
        <!-- Hero -->
        <section class="hero container">
          <div class="hero-badge">⚽ Platforma #1 pentru fotbaliștii amatori din România</div>
          <h1>Joacă la nivelul tău.<br><span class="gradient-text">Fiecare meci contează.</span></h1>
          <p class="hero-subtitle">
            Sistemul ELO te evaluează, colegii te notează, iar tu găsești meciuri echilibrate în orașul tău. 
            Nu mai joci niciodată cu cineva mult prea bun sau mult prea slab.
          </p>
          <div class="hero-actions">
            ${currentUser
                ? `<button class="btn btn-primary btn-lg" onclick="App.navigate('matches')">🔍 Găsește un Meci</button>
                 <button class="btn btn-secondary btn-lg" onclick="App.navigate('profile', '${currentUser.id}')">📋 Profilul Meu</button>`
                : `<button class="btn btn-primary btn-lg" onclick="App.navigate('register')">🚀 Creează-ți Contul</button>
                 <button class="btn btn-secondary btn-lg" onclick="App.showLoginModal()">🔑 Intră în Cont</button>`
            }
          </div>
        </section>

        <!-- Features -->
        <section class="container">
          <div class="features-grid">
            <div class="feature-card animate-in animate-delay-1">
              <div class="feature-icon">📊</div>
              <h3>Rating ELO Real</h3>
              <p>Sistem de rating ca la șah sau jocurile video competitive. Fiecare meci îți actualizează scorul.</p>
            </div>
            <div class="feature-card animate-in animate-delay-2">
              <div class="feature-icon">🃏</div>
              <h3>Card de Jucător Dinamic</h3>
              <p>Card FIFA-style cu statisticile tale: Tehnică, Fair-Play și Condiție Fizică, actualizate live.</p>
            </div>
            <div class="feature-card animate-in animate-delay-3">
              <div class="feature-icon">🎯</div>
              <h3>Matchmaking Inteligent</h3>
              <p>Găsești meciuri exact pe nivelul tău, în orașul tău. Echipe echilibrate automat prin ELO.</p>
            </div>
          </div>
        </section>

        <!-- How it works -->
        <section class="steps-section container">
          <div class="section-header">
            <span class="section-tag">Cum funcționează</span>
            <h2>3 pași simpli</h2>
            <p>De la înscrierea pe platformă la meciuri echilibrate, în câteva minute.</p>
          </div>
          <div class="steps-grid">
            <div class="step-item animate-in animate-delay-1">
              <div class="step-number">1</div>
              <h4>Creează-ți Profilul</h4>
              <p>Alege-ți poziția, orașul și evaluează-ți nivelul inițial. Primești un rating ELO de start.</p>
            </div>
            <div class="step-item animate-in animate-delay-2">
              <div class="step-number">2</div>
              <h4>Joacă & Fii Evaluat</h4>
              <p>Intră în meciuri, joacă, iar la final colegii și adversarii îți dau note pe 3 axe.</p>
            </div>
            <div class="step-item animate-in animate-delay-3">
              <div class="step-number">3</div>
              <h4>Urcă în Clasament</h4>
              <p>Rating-ul tău ELO se actualizează. Cardurile treceau de la Bronze la Diamond. Arată-le cine ești!</p>
            </div>
          </div>
        </section>

        <!-- Top Players -->
        <section class="players-showcase container">
          <div class="section-header">
            <span class="section-tag">Jucătorii de top</span>
            <h2>Clasamentul Național</h2>
            <p>Cei mai bine cotați jucători de pe platformă</p>
          </div>
          <div class="players-scroll">
            ${topPlayers.map(p => Components.playerCard(p, {
                onClick: `App.navigate('profile', '${p.id}')`
            })).join('')}
          </div>
        </section>

        <!-- CTA Final -->
        <section class="container" style="padding: var(--space-3xl) 0;">
          <div class="card" style="text-align:center; padding: var(--space-3xl);">
            <h2>Gata de joc? ⚽</h2>
            <p style="max-width:500px; margin: var(--space-md) auto var(--space-xl);">
              Intră pe platforma folosită de mii de jucători amatori din toată România.
              Sistemul te pune mereu în meciuri echilibrate.
            </p>
            ${currentUser
                ? `<button class="btn btn-primary btn-lg" onclick="App.navigate('matches')">Caută Meciuri 🔍</button>`
                : `<button class="btn btn-primary btn-lg" onclick="App.navigate('register')">Începe Acum — Este Gratuit 🚀</button>`
            }
          </div>
        </section>
      </div>
    `;
    },
};
