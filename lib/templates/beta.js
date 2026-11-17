// Beta testing program e-mails (migration 0034, beta_testing_applications).
//   beta_confirm_email  link to confirm the address (double opt-in)
//   beta_received       the request is on the waiting list
//   beta_approved       selected: sign in / sign up with this address
//   beta_declined       not this time
// Each renderer: (data, locale) => { subject, html, text }. Italian unless locale === 'en'.
const { esc, wrap, button, p, safeLink } = require('./common');

function need(link, name) {
  const ok = safeLink(link);
  if (!ok) throw new Error(`invalid_${name}`);
  return ok;
}

function renderBetaConfirmEmail({ first_name, link }, locale) {
  const it = locale !== 'en';
  const url = need(link, 'link');
  const subject = it ? 'Conferma la tua richiesta di Beta Testing' : 'Confirm your Beta Testing request';
  const hello = it ? `Ciao ${first_name || ''},` : `Hi ${first_name || ''},`;
  const body = it
    ? 'abbiamo ricevuto la tua richiesta di partecipare al programma di Beta Testing di SiteWitness. Per metterla in lista, conferma che questo indirizzo email è tuo. Il link vale 48 ore.'
    : 'we received your request to join the SiteWitness Beta Testing program. To put it on the list, please confirm this email address is yours. The link is valid for 48 hours.';
  const cta = it ? 'Conferma la richiesta' : 'Confirm my request';
  const ignore = it ? 'Se non sei stato tu, ignora questo messaggio: senza la conferma la richiesta non viene considerata.' : 'If this was not you, ignore this message: without the confirmation the request is not considered.';
  const text = `${hello}\n\n${body}\n\n${cta}: ${url}\n\n${ignore}`;
  const html = wrap(esc(subject), `${p(esc(hello))}${p(esc(body))}${button(url, cta)}${p(esc(ignore))}`);
  return { subject, html, text };
}

function renderBetaReceived({ first_name }, locale) {
  const it = locale !== 'en';
  const subject = it ? 'Richiesta di Beta Testing ricevuta' : 'Beta Testing request received';
  const hello = it ? `Ciao ${first_name || ''},` : `Hi ${first_name || ''},`;
  const body = it
    ? 'Abbiamo ricevuto la tua richiesta al programma di Beta Testing di SiteWitness. La valuteremo entro 7 giorni e riceverai una comunicazione, qualunque sia l\'esito.'
    : 'We received your request to the SiteWitness Beta Testing program. We will review it within 7 days and you will hear from us, whatever the outcome.';
  const thanks = it ? 'Grazie per l\'interesse!' : 'Thank you for your interest!';
  const text = `${hello}\n\n${body}\n\n${thanks}`;
  const html = wrap(esc(subject), `${p(esc(hello))}${p(esc(body))}${p(esc(thanks))}`);
  return { subject, html, text };
}

function renderBetaApproved({ first_name, email, login_url, register_url, months }, locale) {
  const it = locale !== 'en';
  const login = need(login_url, 'login_url');
  const register = need(register_url, 'register_url');
  const m = Number(months) > 0 ? Number(months) : 3;
  const subject = it ? 'Sei nel programma di Beta Testing di SiteWitness' : 'You are in the SiteWitness Beta Testing program';
  const hello = it ? `Ciao ${first_name || ''},` : `Hi ${first_name || ''},`;
  const body = it
    ? `sei stato selezionato per il programma di Beta Testing di SiteWitness! Avrai il piano Pro Beta Testing gratis per ${m} mesi, a partire dal tuo primo accesso.`
    : `you have been selected for the SiteWitness Beta Testing program! You get the Pro Beta Testing plan free for ${m} months, starting from your first sign-in.`;
  const how = it
    ? `Collegati al tuo account con ${email}, oppure registrati con ${email} se non l'hai ancora fatto. Usa proprio questo indirizzo: è quello a cui è legato il piano.`
    : `Sign in to your account with ${email}, or sign up with ${email} if you have not yet. Use exactly this address: the plan is tied to it.`;
  const after = it
    ? 'Alla fine del periodo puoi passare a un piano a pagamento oppure restare su Free; puoi anche chiedere la cancellazione dei tuoi dati. Ti chiederemo almeno un feedback sul prodotto durante il periodo di prova o al termine dello stesso.'
    : 'At the end of the period you can move to a paid plan or stay on Free; you can also ask for your data to be deleted. We will ask you for at least one piece of feedback on the product during the trial period or at the end of it.';
  const ctaLogin = it ? 'Accedi' : 'Sign in';
  const ctaRegister = it ? 'Registrati' : 'Sign up';
  const text = `${hello}\n\n${body}\n\n${how}\n\n${ctaLogin}: ${login}\n${ctaRegister}: ${register}\n\n${after}`;
  const html = wrap(
    esc(subject),
    `${p(esc(hello))}${p(esc(body))}${p(esc(how))}${button(login, ctaLogin)}<p style="margin:8px 0;font-size:13px"><a href="${esc(register)}">${esc(ctaRegister)}</a></p>${p(esc(after))}`,
  );
  return { subject, html, text };
}

function renderBetaDeclined({ first_name }, locale) {
  const it = locale !== 'en';
  const subject = it ? 'Programma di Beta Testing di SiteWitness' : 'SiteWitness Beta Testing program';
  const hello = it ? `Ciao ${first_name || ''},` : `Hi ${first_name || ''},`;
  const body = it
    ? 'grazie ancora per l\'interesse nel programma di Beta Testing. Per questa tornata i posti sono limitati e purtroppo non siamo riusciti a includerti: sarà per un\'altra volta.'
    : 'thank you again for your interest in the Beta Testing program. Places are limited this round and we could not include you: maybe next time.';
  const free = it ? 'Puoi comunque registrarti e usare SiteWitness gratis con il piano Free.' : 'You can still sign up and use SiteWitness for free on the Free plan.';
  const text = `${hello}\n\n${body}\n\n${free}`;
  const html = wrap(esc(subject), `${p(esc(hello))}${p(esc(body))}${p(esc(free))}`);
  return { subject, html, text };
}

module.exports = {
  beta_confirm_email: renderBetaConfirmEmail,
  beta_received: renderBetaReceived,
  beta_approved: renderBetaApproved,
  beta_declined: renderBetaDeclined,
};
