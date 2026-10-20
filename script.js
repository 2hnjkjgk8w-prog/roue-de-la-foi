
/* ==========================================
   LA ROUE DE LA FOI
   Roues, sons et fiche de personnage
========================================== */

const resultats = {};

const couleurs = [
  "#7c4dff", "#d94f70", "#3478c9", "#249b83",
  "#d49b36", "#9b59b6", "#d96c36", "#397d8c"
];

/* ---------- SYSTÈME AUDIO ---------- */

let contexteAudio = null;
let dernierClicSon = 0;
let audioDisponible = false;

function activerAudio() {
  const AudioAPI = window.AudioContext || window.webkitAudioContext;

  if (!AudioAPI) return Promise.resolve(false);

  if (!contexteAudio) {
    contexteAudio = new AudioAPI();
  }

  return contexteAudio.resume()
    .then(() => {
      audioDisponible = contexteAudio.state === "running";
      return audioDisponible;
    })
    .catch(() => {
      audioDisponible = false;
      return false;
    });
}

function creerSon(frequence, duree, type, volumeMax) {
  if (!contexteAudio || contexteAudio.state !== "running") return;

  const audio = contexteAudio;
  const debut = audio.currentTime;
  const oscillateur = audio.createOscillator();
  const volume = audio.createGain();

  oscillateur.type = type;
  oscillateur.frequency.setValueAtTime(frequence, debut);

  volume.gain.setValueAtTime(0.001, debut);
  volume.gain.linearRampToValueAtTime(volumeMax, debut + 0.005);
  volume.gain.exponentialRampToValueAtTime(0.001, debut + duree);

  oscillateur.connect(volume);
  volume.connect(audio.destination);

  oscillateur.start(debut);
  oscillateur.stop(debut + duree + 0.01);
}

function jouerClic() {
  if (!audioDisponible) return;

  const maintenant = performance.now();

  if (maintenant - dernierClicSon < 90) return;

  dernierClicSon = maintenant;

  creerSon(
    1000 + Math.random() * 500,
    0.035,
    "square",
    0.035
  );
}

function jouerDing() {
  if (!audioDisponible) return;

  creerSon(880, 0.45, "sine", 0.18);

  setTimeout(() => {
    creerSon(1320, 0.55, "sine", 0.12);
  }, 120);
}

/* ---------- STRUCTURE DE LA PAGE ---------- */

const sectionRoulettes = document.getElementById("roulettes");
const sectionPersonnage = document.getElementById("personnage");

sectionRoulettes.innerHTML = `
  <h2>🎡 Les roulettes</h2>
  <p class="intro">Le destin est entre vos mains. Enfin, presque.</p>

  <button id="tout-lancer" class="bouton-principal">
    ✨ Tout lancer !
  </button>

  <div id="liste-roulettes" class="grille-roulettes"></div>
`;

sectionPersonnage.innerHTML = `
  <div class="fiche-entete">
    <div class="fiche-symbole">✦</div>
    <p class="fiche-surtitre">CHRONIQUES DU DESTIN</p>
    <h2>📜 Fiche de personnage</h2>
    <p class="fiche-description">
      Une âme, un destin, une quantité inquiétante de problèmes.
    </p>
  </div>

  <div class="fiche-corps">
    <label for="nom-personnage">Nom du personnage</label>

    <input
      id="nom-personnage"
      class="champ-nom"
      type="text"
      maxlength="50"
      placeholder="Donnez-lui un nom..."
    >

    <div class="fiche-statut">
      <span>ÉTAT DU DESTIN</span>
      <strong id="message-personnage">
        En attente de création
      </strong>
    </div>

    <h3 class="titre-caracteristiques">
      ✧ Caractéristiques ✧
    </h3>

    <div id="resume-personnage" class="caracteristiques">
      <p class="fiche-vide">
        Les roulettes doivent parler avant que votre légende commence.
      </p>
    </div>

    <button id="copier-fiche" class="bouton-fiche">
      📋 Copier ma fiche
    </button>

    <button id="nouveau-personnage" class="bouton-secondaire">
      🔄 Créer un nouveau personnage
    </button>

    <p id="message-copie" class="message-copie" aria-live="polite"></p>
  </div>
`;

const listeRoulettes = document.getElementById("liste-roulettes");
const resumePersonnage = document.getElementById("resume-personnage");
const champNom = document.getElementById("nom-personnage");

/* ---------- COPIER LA FICHE ---------- */

document.getElementById("copier-fiche").addEventListener("click", async () => {
  const nom = champNom.value.trim() || "Personnage sans nom";

  const lignes = [
    "📜 FICHE DE PERSONNAGE",
    `Nom : ${nom}`,
    ""
  ];

  ROULETTES.forEach((roulette) => {
    lignes.push(
      `${roulette.nom} : ${resultats[roulette.id] || "Non déterminé"}`
    );
  });

  const texte = lignes.join("\n");
  const message = document.getElementById("message-copie");

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texte);
    } else {
      throw new Error("Copie indisponible");
    }

    message.textContent = "✨ Fiche copiée ! Tu peux la coller où tu veux.";
  } catch (erreur) {
    // Solution de secours pour les navigateurs qui bloquent le presse-papiers.
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    zone.style.position = "fixed";
    zone.style.opacity = "0";

    document.body.appendChild(zone);
    zone.select();

    let copieReussie = false;

    try {
      copieReussie = document.execCommand("copy");
    } catch (e) {
      copieReussie = false;
    }

    zone.remove();

    message.textContent = copieReussie
      ? "✨ Fiche copiée ! Tu peux la coller où tu veux."
      : "Copie impossible ici. Essaie dans Safari ou copie le texte manuellement.";
  }
});

/* ---------- CRÉATION DES ROUES ---------- */

ROULETTES.forEach((roulette) => {
  const carte = document.createElement("article");
  carte.className = "carte-roulette";

  carte.innerHTML = `
    <h3>${roulette.nom}</h3>

    <div class="roue-zone">
      <div class="pointeur"></div>
      <canvas class="roue" width="300" height="300"></canvas>
    </div>

    <p class="resultat-roue" aria-live="polite">
      ❔ En attente du destin...
    </p>

    <button class="bouton-lancer">🎲 Faire tourner</button>
  `;

  listeRoulettes.appendChild(carte);

  const canvas = carte.querySelector("canvas");
  const contexte = canvas.getContext("2d");
  const bouton = carte.querySelector(".bouton-lancer");

  const roue = {
    ...roulette,
    canvas,
    contexte,
    carte,
    angle: 0,
    rotation: false,
    resultatElement: carte.querySelector(".resultat-roue"),
    bouton
  };

  dessinerRoue(roue, 0);

  bouton.addEventListener("click", () => lancerRoue(roue));

  roulette.roueVisuelle = roue;
});

/* ---------- DESSIN DES SECTEURS ---------- */

function dessinerRoue(roue, angle) {
  const ctx = roue.contexte;
  const taille = roue.canvas.width;
  const centre = taille / 2;
  const rayon = centre - 8;
  const options = roue.options;
  const secteur = (Math.PI * 2) / options.length;

  ctx.clearRect(0, 0, taille, taille);
  ctx.save();
  ctx.translate(centre, centre);
  ctx.rotate(angle);

  options.forEach((option, index) => {
    const debut = index * secteur - Math.PI / 2;
    const fin = debut + secteur;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rayon, debut, fin);
    ctx.closePath();

    ctx.fillStyle = couleurs[index % couleurs.length];
    ctx.fill();

    ctx.strokeStyle = "#fff4";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(debut + secteur / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${options.length > 8 ? 10 : 12}px system-ui`;
    ctx.shadowColor = "#0008";
    ctx.shadowBlur = 3;

    let texte = option;

    while (
      ctx.measureText(texte).width > rayon * 0.65 &&
      texte.length > 4
    ) {
      texte = texte.slice(0, -2) + "…";
    }

    ctx.fillText(texte, rayon - 12, 0);
    ctx.restore();
  });

  // Centre décoratif
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fillStyle = "#171522";
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#e8bd67";
  ctx.stroke();

  ctx.fillStyle = "#e8bd67";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", 0, 1);

  ctx.restore();
}

/* ---------- LANCEMENT D'UNE ROUE ---------- */

async function lancerRoue(roulette) {
  if (roulette.rotation) return;

  await activerAudio();

  roulette.rotation = true;
  roulette.bouton.disabled = true;
  roulette.resultatElement.textContent = "🎡 Le destin tourne...";

  const choixIndex = Math.floor(
    Math.random() * roulette.options.length
  );

  const tourComplet = Math.PI * 2;
  const secteur = tourComplet / roulette.options.length;

  // Place le centre du secteur choisi sous le pointeur.
  const angleCible =
    (tourComplet - ((choixIndex + 0.5) * secteur) % tourComplet) %
    tourComplet;

  const depart = roulette.angle;
  const angleActuel = ((depart % tourComplet) + tourComplet) % tourComplet;

  let distance = angleCible - angleActuel;

  if (distance < 0) {
    distance += tourComplet;
  }

  const cible = depart + tourComplet * 5 + distance;
  const duree = 3200;
  const debut = performance.now();

  function animer(maintenant) {
    const progression = Math.min((maintenant - debut) / duree, 1);
    const ralenti = 1 - Math.pow(1 - progression, 4);
    const angle = depart + (cible - depart) * ralenti;

    dessinerRoue(roulette, angle);

    if (progression < 1) {
      jouerClic();
      requestAnimationFrame(animer);
    } else {
      roulette.angle = cible % tourComplet;
      roulette.rotation = false;
      roulette.bouton.disabled = false;

      const choix = roulette.options[choixIndex];

      resultats[roulette.id] = choix;
      roulette.resultatElement.textContent = `✨ ${choix}`;

      jouerDing();
      afficherPersonnage();
    }
  }

  requestAnimationFrame(animer);
}

/* ---------- TOUT LANCER ---------- */

document.getElementById("tout-lancer").addEventListener("click", async () => {
  await activerAudio();

  ROULETTES.forEach((roulette) => {
    if (!roulette.roueVisuelle.rotation) {
      lancerRoue(roulette.roueVisuelle);
    }
  });
});

/* ---------- NOUVEAU PERSONNAGE ---------- */

document.getElementById("nouveau-personnage").addEventListener("click", async () => {
  await activerAudio();

  ROULETTES.forEach((roulette) => {
    if (roulette.roueVisuelle.rotation) return;

    delete resultats[roulette.id];

    roulette.roueVisuelle.resultatElement.textContent =
      "❔ En attente du destin...";
  });

  document.getElementById("message-copie").textContent = "";
  afficherPersonnage();

  ROULETTES.forEach((roulette) => {
    if (!roulette.roueVisuelle.rotation) {
      lancerRoue(roulette.roueVisuelle);
    }
  });
});

/* ---------- AFFICHAGE DE LA FICHE ---------- */

function afficherPersonnage() {
  const nombre = Object.keys(resultats).length;
  const total = ROULETTES.length;
  const message = document.getElementById("message-personnage");

  message.textContent =
    nombre === total
      ? "✦ Personnage créé"
      : `${nombre} / ${total} caractéristiques découvertes`;

  resumePersonnage.innerHTML = "";

  if (nombre === 0) {
    const vide = document.createElement("p");
    vide.className = "fiche-vide";
    vide.textContent =
      "Les roulettes doivent parler avant que votre légende commence.";

    resumePersonnage.appendChild(vide);
    return;
  }

  ROULETTES.forEach((roulette) => {
    if (!resultats[roulette.id]) return;

    const carte = document.createElement("div");
    carte.className = "caracteristique";

    const nom = document.createElement("span");
    nom.className = "caracteristique-nom";
    nom.textContent = roulette.nom;

    const valeur = document.createElement("strong");
    valeur.className = "caracteristique-valeur";
    valeur.textContent = resultats[roulette.id];

    carte.append(nom, valeur);
    resumePersonnage.appendChild(carte);
  });
}
