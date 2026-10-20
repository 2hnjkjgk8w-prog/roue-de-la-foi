
/* ==========================================
   LA ROUE DE LA FOI
   Roues visuelles + sons compatibles iPhone
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

  if (!AudioAPI) {
    console.warn("Ce navigateur ne prend pas en charge Web Audio.");
    return Promise.resolve(false);
  }

  if (!contexteAudio) {
    contexteAudio = new AudioAPI();
  }

  return contexteAudio.resume()
    .then(() => {
      audioDisponible = contexteAudio.state === "running";
      return audioDisponible;
    })
    .catch((erreur) => {
      console.warn("Activation audio impossible :", erreur);
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
  volume.gain.exponentialRampToValueAtTime(
    0.001,
    debut + duree
  );

  oscillateur.connect(volume);
  volume.connect(audio.destination);

  oscillateur.start(debut);
  oscillateur.stop(debut + duree + 0.01);
}

function jouerClic() {
  if (!audioDisponible) return;

  const maintenant = performance.now();

  // Limite les sons lorsque plusieurs roues tournent ensemble.
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
  <h2>🧙 Votre personnage</h2>
  <p id="message-personnage">
    Votre destin attend son premier tour.
  </p>
  <div id="resume-personnage"></div>
`;

const listeRoulettes = document.getElementById("liste-roulettes");
const resumePersonnage = document.getElementById("resume-personnage");

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

  bouton.addEventListener("click", () => {
    lancerRoue(roue);
  });

  roulette.roueVisuelle = roue;
});

/* ---------- DESSIN DE LA ROUE ---------- */

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

  // L'activation est déclenchée par le clic de l'utilisateur.
  await activerAudio();

  roulette.rotation = true;
  roulette.bouton.disabled = true;
  roulette.resultatElement.textContent = "🎡 Le destin tourne...";

  const choixIndex = Math.floor(
    Math.random() * roulette.options.length
  );

  const tourComplet = Math.PI * 2;
  const secteur = tourComplet / roulette.options.length;

  // Aligne le centre du résultat choisi avec le pointeur du haut.
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
  // Active l'audio directement pendant le clic.
  await activerAudio();

  ROULETTES.forEach((roulette) => {
    if (!roulette.roueVisuelle.rotation) {
      lancerRoue(roulette.roueVisuelle);
    }
  });
});

/* ---------- RÉSUMÉ DU PERSONNAGE ---------- */

function afficherPersonnage() {
  const nombre = Object.keys(resultats).length;

  document.getElementById("message-personnage").textContent =
    nombre === ROULETTES.length
      ? "🎉 Votre personnage est prêt !"
      : `Votre destin se dessine : ${nombre}/${ROULETTES.length} caractéristiques obtenues.`;

  resumePersonnage.innerHTML = "";

  ROULETTES.forEach((roulette) => {
    if (!resultats[roulette.id]) return;

    const ligne = document.createElement("p");
    ligne.className = "ligne-personnage";

    const nom = document.createElement("strong");
    nom.textContent = `${roulette.nom} : `;

    ligne.append(
      nom,
      document.createTextNode(resultats[roulette.id])
    );

    resumePersonnage.appendChild(ligne);
  });
}
