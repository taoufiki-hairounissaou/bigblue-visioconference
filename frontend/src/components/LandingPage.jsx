const FEATURES = [
  {
    icon: '🎥',
    title: 'Audio & vidéo en direct',
    text: "Rejoins tes collègues en visioconférence fluide, avec connexion pair-à-pair sécurisée."
  },
  {
    icon: '🖥️',
    title: "Partage d'écran",
    text: "Montre ton écran, ton onglet ou une fenêtre précise en un clic, pour présenter sans friction."
  },
  {
    icon: '💬',
    title: 'Chat public & privé',
    text: "Échange avec toute la salle ou envoie un message discret à une seule personne."
  },
  {
    icon: '📊',
    title: 'Sondages en direct',
    text: "Lance une question à chaud, vois les réponses arriver en temps réel."
  },
  {
    icon: '📝',
    title: 'Notes partagées',
    text: "Garde une trace commune de la réunion, visible par tous, modifiable par les organisateurs."
  },
  {
    icon: '🛡️',
    title: 'Modération complète',
    text: "Gère les rôles, coupe un micro, promeus un présentateur — tu gardes le contrôle de la salle."
  }
];

function MeetingIllustration() {
  return (
    <div className="illustration-grid">
      {['SA', 'MB', 'OU', 'KH', 'TA'].map((initials, i) => (
        <div key={i} className={`illustration-tile tile-${i}`}>
          <span>{initials}</span>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage({ onEnter }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="display landing-brand">BigBlue</span>
        <button className="btn-primary" onClick={onEnter}>Se connecter</button>
      </header>

      <section className="landing-hero">
        <h1 className="display landing-title">
          La visioconférence, <span className="text-accent">sans compromis</span>
        </h1>
        <p className="landing-subtitle">
          Réunions, chat, sondages, notes partagées et modération — tout ce qu'il faut
          pour travailler ensemble, à distance.
        </p>
        <button className="btn-primary btn-hero" onClick={onEnter}>Commencer</button>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="landing-showcase">
        <div className="showcase-text">
          <h2 className="display">Retrouve toute ton équipe, au même endroit</h2>
          <p>
            Une seule salle, tous les outils : caméra, micro, écran partagé, chat et
            sondages — sans jongler entre plusieurs applications.
          </p>
        </div>
        <MeetingIllustration />
      </section>

      <section className="landing-cta">
        <h2 className="display">Prêt à démarrer ?</h2>
        <button className="btn-primary btn-hero" onClick={onEnter}>Se connecter / S'inscrire</button>
      </section>

      <footer className="landing-footer">
        <span>BigBlue — Plateforme de visioconférence</span>
      </footer>
    </div>
  );
}
