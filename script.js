
/* LA ROUE DE LA FOI */

const resultats = {};

const sectionRoulettes = document.getElementById("roulettes");
const sectionPersonnage = document.getElementById("personnage");

// Prépare la zone des roulettes
sectionRoulettes.innerHTML = `
  <h2>🎲 Les roulettes</h2>
  <p>Lance chaque roulette séparément ou laisse le hasard décider de tout !</p>
  <button id="tout-lancer">🎡 Tout lancer !</button>
  <div id="liste-roulettes"></div>
`;

const listeRoulettes = document.getElementById("liste-roulettes");

// Prépare la fiche du personnage
sectionPersonnage.innerHTML = `
  <h2>🧙 Votre personnage</h2>
  <p id="message-personnage">Lancez les roulettes pour découvrir votre personnage.</p>
  <div id="resume-personnage"></div>
`;

const resumePersonnage = document.getElementById("resume-personnage");

// Crée chaque roulette
ROULETTES.forEach((roulette) => {
  const carte = document.createElement("article");
  carte.className = "roulette";
  carte.style.marginTop = "22px";
  carte.style.padding = "16px";
  carte.style.border = "1px solid var(--bordure)";
  carte.style.borderRadius = "14px";

  const titre = document.createElement("h3");
  titre.textContent = roulette.nom;
  titre.style.color = "var(--or)";

  const resultat = document.createElement("p");
  resultat.textContent = "❔ Pas encore lancé";
  resultat.id = `resultat-${roulette.id}`;
  resultat.setAttribute("aria-live", "polite");

  const bouton = document.createElement("button");
  bouton.textContent = "🎲 Lancer";
  bouton.type = "button";
  bouton.addEventListener("click", () => lancerRoulette(roulette));

  carte.append(titre, resultat, bouton);
  listeRoulettes.appendChild(carte);
});

// Tire un résultat au hasard
function lancerRoulette(roulette) {
  const index = Math.floor(Math.random() * roulette.options.length);
  const choix = roulette.options[index];

  resultats[roulette.id] = choix;

  document.getElementById(`resultat-${roulette.id}`).textContent =
    `✨ ${choix}`;

  afficherPersonnage();
}

// Lance toutes les roulettes
document.getElementById("tout-lancer").addEventListener("click", () => {
  ROULETTES.forEach((roulette) => lancerRoulette(roulette));
});

// Affiche le résumé des résultats obtenus
function afficherPersonnage() {
  const nombreResultats = Object.keys(resultats).length;

  document.getElementById("message-personnage").textContent =
    nombreResultats === ROULETTES.length
      ? "Votre personnage est généré !"
      : `Votre personnage prend forme : ${nombreResultats}/${ROULETTES.length} caractéristiques tirées.`;

  resumePersonnage.innerHTML = "";

  ROULETTES.forEach((roulette) => {
    if (!resultats[roulette.id]) return;

    const ligne = document.createElement("p");
    const nom = document.createElement("strong");
    nom.textContent = `${roulette.nom} : `;
    ligne.append(nom, document.createTextNode(resultats[roulette.id]));
    resumePersonnage.appendChild(ligne);
  });
}
