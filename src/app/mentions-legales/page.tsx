import type { Metadata } from 'next';
import { Callout, LegalLayout, LegalTable } from '@/components/ui/PageHero';
import { SITE, STUDIO } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Mentions légales du site ${STUDIO.name} : éditeur, hébergeur, propriété intellectuelle.`,
  robots: { index: false, follow: true },
};

/** Champs à renseigner par le client avant la mise en ligne. */
const TO_COMPLETE = '— à compléter avant mise en ligne —';

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="14 septembre 2026">
      <Callout title="Document de démonstration" tone="orange">
        Les informations d’identification (raison sociale, SIRET, numéro de TVA, assurance, hébergeur) sont
        volontairement laissées à compléter&nbsp;: elles ne peuvent pas être inventées. Elles doivent être
        renseignées par le studio avant toute mise en ligne, conformément à l’article&nbsp;6-III de la loi
        n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique.
      </Callout>

      <h2>Éditeur du site</h2>
      <LegalTable>
        <table>
        <tbody>
          <tr>
            <td>Dénomination</td>
            <td>{STUDIO.legalName}</td>
          </tr>
          <tr>
            <td>Forme juridique</td>
            <td>{TO_COMPLETE}</td>
          </tr>
          <tr>
            <td>Siège social</td>
            <td>
              {STUDIO.address.street}, {STUDIO.address.postalCode} {STUDIO.address.city}, {STUDIO.address.country}
            </td>
          </tr>
          <tr>
            <td>SIRET</td>
            <td>{TO_COMPLETE}</td>
          </tr>
          <tr>
            <td>Numéro de TVA intracommunautaire</td>
            <td>{TO_COMPLETE}</td>
          </tr>
          <tr>
            <td>Directeur de la publication</td>
            <td>{STUDIO.coach.firstName}, gérant</td>
          </tr>
          <tr>
            <td>Téléphone</td>
            <td>{STUDIO.phone}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>{STUDIO.email}</td>
          </tr>
          <tr>
            <td>Carte professionnelle d’éducateur sportif</td>
            <td>{TO_COMPLETE}</td>
          </tr>
          <tr>
            <td>Assurance responsabilité civile professionnelle</td>
            <td>{TO_COMPLETE}</td>
          </tr>
        </tbody>
      </table>
      </LegalTable>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par&nbsp;: {TO_COMPLETE} (raison sociale, adresse postale et téléphone de
        l’hébergeur). Cette mention est obligatoire et doit désigner l’hébergeur effectif du site en production.
      </p>

      <h2>Activité réglementée</h2>
      <p>
        L’enseignement du sport contre rémunération est soumis à l’article L.212-1 du code du sport. Les séances
        proposées sur ce site sont encadrées par un éducateur sportif titulaire d’un diplôme STAPS et déclaré
        auprès de la Direction régionale et départementale de la jeunesse, des sports et de la cohésion sociale.
        Le numéro de carte professionnelle figure ci-dessus.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’identité visuelle du studio — nom, logotype, mascotte, déclinaisons graphiques et chartes associées — a
        été créée par le studio de design Call me Claro et demeure la propriété de {STUDIO.legalName}. Les
        typographies utilisées sont Manrope et Reenie Beanie (SIL Open Font License) ainsi que Sun Motter,
        exploitée sous licence acquise auprès de son auteur.
      </p>
      <p>
        Toute reproduction, représentation, modification ou adaptation, totale ou partielle, des éléments du site
        est interdite sans autorisation écrite préalable, à l’exception des courtes citations autorisées par
        l’article L.122-5 du code de la propriété intellectuelle.
      </p>

      <h2>Photographies et visuels</h2>
      <p>
        Les visuels du local actuellement présentés sur ce site sont des images de substitution, utilisées le
        temps des travaux d’aménagement. Elles seront remplacées par des photographies réelles du studio à
        l’ouverture.
      </p>

      <h2>Liens hypertextes</h2>
      <p>
        Le site peut renvoyer vers des sites tiers. {STUDIO.legalName} n’exerce aucun contrôle sur leur contenu et
        décline toute responsabilité quant aux informations qui y figurent.
      </p>

      <h2>Signalement d’un contenu</h2>
      <p>
        Pour signaler un contenu manifestement illicite ou une erreur sur ce site, écrivez à{' '}
        <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>. Une réponse est apportée dans les meilleurs délais.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le présent site et son utilisation sont soumis au droit français. Le site est édité à l’adresse{' '}
        {SITE.url}.
      </p>
    </LegalLayout>
  );
}
