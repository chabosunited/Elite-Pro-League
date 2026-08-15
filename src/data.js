export const demo = {
  brand: {
    name: 'EPL - Elite Pro League',
    logo: '/assets/brand/epl-logo.png',
    trophy: '/assets/user/EPLTrophy.png',
    defaultAvatar: '/assets/user/standardprofilbild.png',
    defaultClub: '/assets/user/EPLTrophy.png',
    defaultCover: '/assets/user/slider-1.png',
    defaultCoinArt: '/assets/user/coin-balance-box.png',
    coinIcon: '/assets/user/coin-logo.png'
  },
  heroSlides: [
    {
      eyebrow: 'Top-News',
      title: 'Die Elite Pro League\nstartet in die neue Saison',
      copy: 'Registriere dein Team, baue deinen Kader auf und kämpfe um den Titel in einer professionellen Pro-Clubs-Liga mit echter Tabellenführung, Transfers und Saisonbetrieb.',
      ctaPrimary: { label: 'JETZT REGISTRIEREN', href: '/registrieren' },
      ctaSecondary: { label: 'MEHR ERFAHREN', href: '/liga' },
      visual: '/assets/user/slider-1.png'
    },
    {
      eyebrow: 'Social Profiles',
      title: 'Spieler- und Teamprofile\nmit echtem Social-Look',
      copy: 'Profilbild, Titelbild, Folgen-Funktion, Feed, Highlights, Trophäen und individuelle Statistiken sorgen für eine moderne Community-Plattform.',
      ctaPrimary: { label: 'SPIELER ENTDECKEN', href: '/spieler' },
      ctaSecondary: { label: 'TEAMS ENTDECKEN', href: '/teams' },
      visual: '/assets/user/slider-4.png'
    },
    {
      eyebrow: 'Manager Tools',
      title: 'Verträge, Bewerbungen\nund Matchverwaltung',
      copy: 'Manager verwalten Kader, senden Vertragsangebote, prüfen Bewerbungen und bestätigen Ergebnisse direkt auf der Plattform.',
      ctaPrimary: { label: 'MANAGER PANEL', href: '/manager' },
      ctaSecondary: { label: 'REGELWERK', href: '/regeln' },
      visual: '/assets/user/slider-3.png'
    },
    {
      eyebrow: 'EPL Coins',
      title: 'Verdiene Coins durch Leistung\nund nutze sie im Shop',
      copy: 'Mit Siegen, MOTM-Auszeichnungen und Saisonzielen verdienst du EPL Coins für Rahmen, Badges, Namenseffekte und mehr.',
      ctaPrimary: { label: 'ZUM SHOP', href: '/shop' },
      ctaSecondary: { label: 'COINS SYSTEM', href: '/shop' },
      visual: '/assets/user/coin-balance-box.png'
    }
  ],
  newsPlaceholders: [
    {
      id: 'seed-news-1',
      title: 'Saison 1: Die Anmeldung ist eröffnet',
      excerpt: 'Spieler und Teams können sich jetzt offiziell für die erste Saison der Elite Pro League registrieren.',
      published_at: '2026-08-09T12:00:00Z',
      image: '/assets/user/news.png'
    },
    {
      id: 'seed-news-2',
      title: 'Transfermarkt und Verträge sind vorbereitet',
      excerpt: 'Manager können Vertragsangebote, Bewerbungen und künftige Wechsel direkt über die Plattform organisieren.',
      published_at: '2026-08-09T12:00:00Z',
      image: '/assets/user/news1.png'
    },
    {
      id: 'seed-news-3',
      title: 'Social-Media-Profile für Spieler und Teams',
      excerpt: 'Profile mit Titelbild, Feed und Follow-System sorgen für einen modernen Community-Look.',
      published_at: '2026-08-09T12:00:00Z',
      image: '/assets/user/news2.png'
    }
  ],
  featureIcons: [
    { image: '/assets/user/icon1.png', title: 'Echte Statistiken', text: 'Verfolge alle Daten, Ergebnisse und Statistiken in Echtzeit – transparent und detailliert.' },
    { image: '/assets/user/icon2.png', title: 'Transfers & Markt', text: 'Ein dynamischer Transfermarkt bringt Strategie und Spannung in jede Saison.' },
    { image: '/assets/user/icon4.png', title: 'Saisonbetrieb', text: 'Realistischer Ligabetrieb mit Auf- und Abstieg sowie Pokalwettbewerben.' },
    { image: '/assets/user/icon5.png', title: 'Manager-System', text: 'Organisiere dein Team, manage Verträge und führe deinen Club zum Erfolg.' }
  ],
  shop: [
    { id: 1, name: 'NEON BLUE', type: 'Profilbildrahmen', price: 750, image: '/assets/user/shop/Profibildrahmen1.png', rarity: 'EPIC' },
    { id: 2, name: 'ELITE GOLD', type: 'Titelbildrahmen', price: 1250, image: '/assets/user/shop/titelbildrahmen1.png', rarity: 'LEGENDARY' },
    { id: 3, name: 'LIGHTNING', type: 'Namenseffekt', price: 1000, image: '/assets/user/Namenseffekt1.png', rarity: 'EPIC' },
    { id: 4, name: 'EPL CHAMPION', type: 'Badge', price: 1500, image: '/assets/user/EPLTrophy.png', rarity: 'LEGENDARY' }
  ],
  coinPacks: [
    { id: 'coins_500', coins: 500, cents: 499, label: '500 EPL COINS' },
    { id: 'coins_1200', coins: 1200, cents: 999, label: '1.200 EPL COINS' },
    { id: 'coins_2500', coins: 2500, cents: 1999, label: '2.500 EPL COINS', bonus: '+15% BONUS' }
  ],
  starterRewards: [
    ['⚔', 'Siegbonus', '+150 E'],
    ['🏆', 'Man of the Match', '+100 E'],
    ['⚽', 'Tor des Spieltags', '+75 E'],
    ['🛡', 'Clean Sheet', '+75 E'],
    ['▣', 'Saisonziele', 'Bis zu +2.000 E']
  ]
};
