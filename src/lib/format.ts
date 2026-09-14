/** Formatage des montants. Tous les prix circulent en centimes (entiers). */

const EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  return EURO.format(cents / 100);
}

/** Version compacte pour les graphiques : « 1,2 k€ ». */
export function formatPriceCompact(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) return `${(euros / 1000).toFixed(1).replace('.', ',')} k€`;
  return `${Math.round(euros)} €`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count > 1 ? plural : singular;
}
