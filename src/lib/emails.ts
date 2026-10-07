/**
 * Modèles des e-mails envoyés par le site (via Brevo). HTML simple, en ligne,
 * compatible avec les messageries (tableaux + styles inline).
 * Les e-mails « marketing » de la chaîne d'onboarding, eux, se rédigent dans Brevo.
 */

const C = {
  green900: "#2d4839",
  green700: "#426e55",
  rose600: "#cb748e",
  sand50: "#faf7f2",
  text: "#2b2b28",
  muted: "#6b6b63",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(opts: { preheader: string; title: string; body: string; cta?: { label: string; href: string }; footnote?: string }) {
  const cta = opts.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${opts.cta.href}" style="display:inline-block;background:${C.green700};color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 26px;border-radius:10px">${esc(opts.cta.label)}</a></td></tr>
       <tr><td style="font-size:12px;color:${C.muted};padding-bottom:16px">Le bouton ne marche pas ? Copiez ce lien :<br><span style="word-break:break-all;color:${C.green700}">${opts.cta.href}</span></td></tr>`
    : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${C.sand50};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${C.text}">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand50};padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;padding:32px">
<tr><td style="font-family:Georgia,serif;font-size:18px;color:${C.green900};padding-bottom:24px">Matières Premières</td></tr>
<tr><td style="font-family:Georgia,serif;font-size:26px;line-height:1.25;color:${C.green900};padding-bottom:16px">${esc(opts.title)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;padding-bottom:16px">${opts.body}</td></tr>
${cta}
${opts.footnote ? `<tr><td style="font-size:12px;line-height:1.5;color:${C.muted};border-top:1px solid #eee;padding-top:16px">${opts.footnote}</td></tr>` : ""}
</table>
<div style="font-size:12px;color:${C.muted};padding-top:16px">© Matières Premières — le réseau des producteurs et des restaurateurs</div>
</td></tr></table></body></html>`;
}

/** À l'inscription : bienvenue + confirmation de l'adresse. */
export function welcomeEmail(p: {
  name: string;
  audience: "producer" | "buyer" | "consumer";
  verifyUrl: string;
}) {
  const next = {
    producer:
      "Pendant que notre équipe vérifie votre inscription, vous pouvez déjà compléter votre page producteur et ajouter vos produits.",
    buyer:
      "Pendant que notre équipe vérifie votre inscription, vous pouvez déjà parcourir le catalogue et découvrir les producteurs du réseau.",
    consumer:
      "Choisissez les producteurs que vous voulez suivre : leurs actus arriveront dans votre fil, et chaque dimanche matin dans un petit récap. Pas d'actu, pas de mail.",
  }[p.audience];
  return {
    subject: "Bienvenue sur Matières Premières — confirmez votre adresse",
    html: layout({
      preheader: "Un clic pour confirmer votre adresse e-mail.",
      title: `Bienvenue, ${p.name} !`,
      body: `Votre espace est créé. Pour commencer, confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.<br><br>${next}`,
      cta: { label: "Confirmer mon adresse", href: p.verifyUrl },
      footnote: "Ce lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.",
    }),
  };
}

/** Renvoi du lien de confirmation, à la demande. */
export function verifyEmail(p: { verifyUrl: string }) {
  return {
    subject: "Confirmez votre adresse e-mail",
    html: layout({
      preheader: "Un clic pour confirmer votre adresse e-mail.",
      title: "Confirmez votre adresse",
      body: "Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail.",
      cta: { label: "Confirmer mon adresse", href: p.verifyUrl },
      footnote: "Ce lien est valable 7 jours.",
    }),
  };
}

/** Quand l'admin passe le compte de « À valider » à « Actif ». */
export function accountActivatedEmail(p: { name: string; isProducer: boolean; url: string }) {
  return {
    subject: "Votre compte Matières Premières est validé",
    html: layout({
      preheader: "Votre compte est actif.",
      title: "C'est validé !",
      body: p.isProducer
        ? `Bonne nouvelle ${esc(p.name)} : votre compte producteur est validé. Votre page est désormais visible des restaurateurs du réseau, et vous pouvez recevoir des commandes.`
        : `Bonne nouvelle ${esc(p.name)} : votre compte est validé. Vous pouvez dès maintenant commander auprès des producteurs du réseau.`,
      cta: { label: "Accéder à mon espace", href: p.url },
    }),
  };
}

export function resetPasswordEmail(p: { resetUrl: string }) {
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout({
      preheader: "Choisissez un nouveau mot de passe.",
      title: "Nouveau mot de passe",
      body: "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
      cta: { label: "Choisir un nouveau mot de passe", href: p.resetUrl },
      footnote: "Ce lien est valable 1 heure et ne fonctionne qu'une fois. Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe reste inchangé.",
    }),
  };
}

/** Récap du dimanche d'un particulier : les actus de la semaine de ses producteurs. */
export function weeklyDigestEmail(p: {
  firstName: string;
  week: string;
  items: { producer: string; kind: string; title: string; excerpt: string; url: string }[];
  feedUrl: string;
  settingsUrl: string;
}) {
  const producers = new Set(p.items.map((i) => i.producer)).size;
  const rows = p.items
    .map(
      (i) => `<div style="padding:16px 0;border-top:1px solid #eee">
  <div style="font-size:12px;color:${C.muted}">${esc(i.producer)} · <span style="color:${C.rose600};font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:11px">${esc(i.kind)}</span></div>
  <div style="font-family:Georgia,serif;font-size:18px;color:${C.green900};padding:4px 0"><a href="${i.url}" style="color:${C.green900};text-decoration:none">${esc(i.title)}</a></div>
  ${i.excerpt ? `<div style="font-size:14px;line-height:1.6;color:${C.text}">${esc(i.excerpt)}</div>` : ""}
</div>`,
    )
    .join("");
  return {
    subject: `Cette semaine chez vos producteurs (${producers} ${producers > 1 ? "fermes" : "ferme"})`,
    html: layout({
      preheader: p.items
        .slice(0, 2)
        .map((i) => i.title)
        .join(" · "),
      title: `Bonjour ${p.firstName}`,
      body: `${esc(p.week)} : voici ce qui a bougé chez vos producteurs.${rows}`,
      cta: { label: "Voir toutes les actus", href: p.feedUrl },
      footnote: `Vous recevez ce mail parce que vous suivez ces producteurs sur Matières Premières. Pas d'actu, pas de mail. <a href="${p.settingsUrl}" style="color:${C.green700}">Choisir qui y figure ou ne plus le recevoir</a>.`,
    }),
  };
}
