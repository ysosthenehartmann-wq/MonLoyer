// src/lib/bail.js (VERSION WEB)
// Le texte du contrat est celui du bail de l'application mobile (Loi n° 2019-576).
// Seule la dernière fonction (genererBail) est propre au navigateur.

// On importe deux outils déjà présents dans le projet web : formater un montant et une date
import { formatMoney, formatDate } from "./dates";

// Les couleurs du contrat, déclarées une seule fois pour pouvoir les réutiliser plus bas
const NAVY = "#0D1B3D";   // bleu nuit (bandeau et titres)
const GOLD = "#D4A017";   // or (trait sous les titres d'articles)
const INK = "#2A2A28";    // presque noir (texte)
const MUTED = "#6B6B63";  // gris (mention de bas de page)

// Une ligne à remplir à la main quand l'information manque
const LIGNE = "______________________";

// Protège la page : un nom qui contient < ou & ne casse pas le document
function e(texte) {
  return String(texte ?? "")          // transforme la valeur en texte (vide si elle n'existe pas)
    .replace(/&/g, "&amp;")           // & devient &amp;
    .replace(/</g, "&lt;")            // < devient &lt;
    .replace(/>/g, "&gt;");           // > devient &gt;
}

// Affiche la valeur si elle existe, sinon une ligne à remplir à la main
function ou(valeur) {
  return valeur ? e(valeur) : LIGNE;
}

// Construit tout le contrat sous forme de page HTML
function bailHTML({ proprietaire, immeuble, logement, locataire }) {
  // Montants : formatés s'ils existent, sinon une ligne vide à remplir
  const loyer = logement?.loyer ? formatMoney(logement.loyer) : "______________";
  const caution = locataire?.cautionMontant > 0 ? formatMoney(locataire.cautionMontant) : "______________";
  const avance = locataire?.avanceMontant > 0 ? formatMoney(locataire.avanceMontant) : "______________";
  // Date d'entrée du locataire, formatée si elle existe
  const entree = locataire?.dateEntree ? formatDate(locataire.dateEntree) : "______________";
  // Description des locaux : "nom du logement — nom de l'immeuble" (ex : Appartement 1A — Cité Yavo)
  const description = [logement?.nom, immeuble?.nom].filter(Boolean).map(e).join(" — ") || LIGNE;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Contrat de bail - ${e(locataire?.nom)}</title>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; margin: 0; color: ${INK}; font-size: 13px; line-height: 1.55; }
        .bandeau { background: ${NAVY}; color: white; padding: 24px 32px; }
        .bandeau h1 { margin: 0; font-size: 24px; }
        .bandeau p { margin: 6px 0 0; font-size: 12px; opacity: 0.85; }
        .corps { padding: 24px 32px; }
        h2 { color: ${NAVY}; font-size: 14px; margin: 20px 0 6px; border-bottom: 2px solid ${GOLD}; padding-bottom: 3px; break-after: avoid; }
        p { margin: 5px 0; }
        .petit { font-size: 11px; color: ${MUTED}; }
        ol { margin: 4px 0; padding-left: 20px; }
        li { margin: 3px 0; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; break-inside: avoid; }
        .signatures div { width: 45%; text-align: center; }
        .signatures .zone { height: 70px; border-bottom: 1px solid ${INK}; }
        .footer { margin-top: 30px; font-size: 11px; color: ${MUTED}; }
        @media print { .bandeau { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="bandeau">
        <h1>MonLoyer</h1>
        <p>Contrat de bail à usage d'habitation — Conforme à la Loi n° 2019-576 du 26 juin 2019</p>
      </div>
      <div class="corps">
        <p><b>Entre les soussignés :</b></p>
        <p>Le Bailleur : M./Mme/Mlle ${ou(proprietaire?.nom)},</p>
        <p>Né(e) le ______________ à ______________, Nationalité : ______________,</p>
        <p>Titulaire de la pièce d'identité (CNI / Passeport) n° ______________________,</p>
        <p>Demeurant à ______________________, Téléphone : ${ou(proprietaire?.telephone)}.</p>
        <p class="petit">Ci-après dénommé « Le BAILLEUR » d'une part,</p>
        <p><b>ET</b></p>
        <p>Le Locataire : M./Mme/Mlle ${ou(locataire?.nom)},</p>
        <p>Né(e) le ______________ à ______________, Nationalité : ______________,</p>
        <p>Titulaire de la pièce d'identité (CNI / Passeport) n° ______________________,</p>
        <p>Profession : ______________________, Téléphone : ${ou(locataire?.telephone)}.</p>
        <p class="petit">Ci-après dénommé « Le LOCATAIRE » d'autre part.</p>
        <p>Il a été convenu et arrêté ce qui suit :</p>

        <h2>Article 1 — Objet du contrat et désignation</h2>
        <p>Le BAILLEUR donne à bail à usage d'habitation exclusive au LOCATAIRE, qui accepte, les locaux désignés ci-après, situés à :</p>
        <p>Ville : ${ou(immeuble?.adresse)} Quartier : ______________ Lot : ______ Îlot : ______</p>
        <p>Description des locaux (consistance, nombre de pièces, équipements) :</p>
        <p>${description}</p>

        <h2>Article 2 — Durée et prise d'effet</h2>
        <p>Le présent contrat est conclu pour une durée de ______________ (généralement un an), renouvelable par tacite reconduction dans les mêmes conditions contractuelles, sauf congé donné par l'une des parties dans les conditions prévues à l'Article 6 ci-après.</p>
        <p>Il prendra effet le ${entree}.</p>

        <h2>Article 3 — Conditions financières (loyer, avance et caution)</h2>
        <p>Le présent bail est consenti et accepté sous les conditions financières suivantes, strictement conformes aux plafonds légaux ivoiriens :</p>
        <p>– Loyer mensuel : Fixé à la somme de ${loyer} (en lettres : ______________________________________). Le loyer est payable d'avance, au plus tard le ${ou(logement?.jourEcheance)} de chaque mois. Le BAILLEUR délivre au LOCATAIRE une quittance pour chaque paiement effectué.</p>
        <p>– Avance sur loyer : Le LOCATAIRE verse ce jour la somme de ${avance}, ne pouvant excéder deux (2) mois de loyer (maximum légal), applicable aux derniers mois d'occupation.</p>
        <p>– Dépôt de garantie (Caution) : Le LOCATAIRE verse ce jour la somme de ${caution}, ne pouvant excéder deux (2) mois de loyer (maximum légal). Ce montant n'est pas productif d'intérêts et est destiné à garantir l'exécution des obligations du LOCATAIRE (dégradations, impayés, manquements).</p>
        <p>Un état des lieux contradictoire et écrit est établi entre les parties à l'entrée dans les lieux (voir Article 7).</p>
        <p>Le dépôt de garantie sera restitué au LOCATAIRE dans un délai maximum d'un (1) mois à compter de la restitution des clés, déduction faite, le cas échéant, des sommes dues au BAILLEUR ou des réparations dûment justifiées à l'état des lieux de sortie. En cas de transfert de propriété de l'immeuble en cours de bail, la restitution du dépôt de garantie incombe au nouveau BAILLEUR.</p>

        <h2>Article 4 — Révision du loyer</h2>
        <p>Conformément à la loi en vigueur, le montant du loyer peut faire l'objet d'une révision, à la hausse ou à la baisse, seulement après un délai minimal de trois (3) années d'occupation effective à compter de la conclusion du présent contrat ou de la précédente révision.</p>
        <p>La partie qui sollicite une révision doit notifier son intention à l'autre partie par écrit, au moins trois (3) mois avant la date d'effet de ladite révision. À défaut de respecter ce délai ou cette échéance, la révision est réputée n'avoir jamais été convenue.</p>

        <h2>Article 5 — Obligations des parties</h2>
        <p><b>Le BAILLEUR s'oblige à :</b></p>
        <ol>
          <li>Délivrer au LOCATAIRE un logement décent, en bon état de réparation de toute espèce, et ne comportant aucun risque d'atteinte à la sécurité ou à la santé du LOCATAIRE.</li>
          <li>Assurer à ses frais exclusifs les grosses réparations (murs porteurs, fondations, structure, toiture, étanchéité, canalisations et plomberie lourde, ascenseurs, escaliers) ainsi que celles rendues nécessaires par un cas de force majeure.</li>
          <li>Garantir au LOCATAIRE une jouissance paisible des lieux pendant toute la durée du bail.</li>
        </ol>
        <p><b>Le LOCATAIRE s'oblige à :</b></p>
        <ol>
          <li>Payer le loyer aux échéances convenues.</li>
          <li>User des locaux en bon père de famille, paisiblement et exclusivement pour l'habitation (usage commercial strictement interdit sauf accord contraire des parties).</li>
          <li>Prendre à sa charge l'entretien courant et les réparations locatives ordinaires.</li>
          <li>Ne faire aucune transformation ni modification du logement sans l'accord écrit préalable du BAILLEUR.</li>
          <li>Ne pas céder son bail ni sous-louer le logement, sauf autorisation expresse du BAILLEUR ou, sans autorisation nécessaire, au profit de ses ascendants et descendants directs, à condition que le LOCATAIRE continue d'honorer ses obligations contractuelles à l'égard du BAILLEUR.</li>
        </ol>

        <h2>Article 6 — Résiliation, non-renouvellement et préavis</h2>
        <p>Chacune des parties peut mettre fin au présent contrat, à l'échéance du terme ou en cours de bail à durée indéterminée, en donnant congé notifié par écrit (acte de commissaire de justice, lettre recommandée avec accusé de réception, ou remise de courrier contre décharge), moyennant un préavis obligatoire de trois (3) mois.</p>
        <p>Le BAILLEUR ne peut refuser le renouvellement du bail ou donner congé au LOCATAIRE que pour l'un des motifs légitimes suivants :</p>
        <ol>
          <li>La reprise du logement pour l'occuper lui-même, ou pour le faire occuper de manière effective par un ascendant, un descendant, ou un allié jusqu'au troisième degré inclusivement ;</li>
          <li>Le manquement du LOCATAIRE à l'une de ses obligations contractuelles ;</li>
          <li>Tout autre motif grave et légitime, à l'exclusion du seul transfert de propriété de l'immeuble, notamment la nécessité de démolir ou de reconstruire l'immeuble (décision d'une autorité compétente, projet d'urbanisme ou de sécurité publique, etc.).</li>
        </ol>
        <p>Le BAILLEUR qui reprend le logement pour l'un des motifs ci-dessus est tenu de l'occuper, ou d'y installer le bénéficiaire de la reprise, dans un délai de trois (3) mois à compter du départ effectif du LOCATAIRE, et de l'occuper pendant une durée minimale d'une (1) année.</p>

        <h2>Article 7 — État des lieux et enregistrement</h2>
        <p>Un état des lieux contradictoire est établi par écrit entre les parties, ou leurs représentants dûment mandatés, à l'entrée du LOCATAIRE dans les lieux et à sa sortie.</p>
        <p>Le présent contrat fera obligatoirement l'objet d'un enregistrement auprès de l'administration fiscale compétente, dans les conditions et modalités prévues par le Code Général des Impôts. Le BAILLEUR ou son représentant remet au LOCATAIRE, dans un délai de trente (30) jours calendaires après l'accomplissement des formalités requises, un exemplaire de l'acte d'enregistrement délivré par l'administration fiscale.</p>

        <p style="margin-top:22px">Fait à ______________________, le ______________________, en trois (3) exemplaires originaux.</p>

        <div class="signatures">
          <div><b>Le BAILLEUR</b><p class="petit">(Précédé de la mention « Lu et approuvé »)</p><div class="zone"></div></div>
          <div><b>Le LOCATAIRE</b><p class="petit">(Précédé de la mention « Lu et approuvé »)</p><div class="zone"></div></div>
        </div>
        <div class="footer">Modèle fourni par MonLoyer — les champs non renseignés dans l'application sont laissés à compléter à la main avant signature.</div>
      </div>
    </body>
  </html>`;
}

// Ouvre le bail dans un nouvel onglet et lance l'impression
// (dans la fenêtre d'impression, choisir "Enregistrer au format PDF")
export function genererBail(payload) {
  const fenetre = window.open("", "_blank");          // onglet vide
  if (!fenetre) { alert("Autorisez les fenêtres pop-up pour générer le bail."); return; }
  fenetre.document.write(bailHTML(payload));          // on y écrit le contrat
  fenetre.document.close();                           // fin d'écriture
  fenetre.focus();
  setTimeout(() => fenetre.print(), 300);             // petit délai pour que la page s'affiche
}
