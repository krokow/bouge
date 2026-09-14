import { formatPrice } from '@/lib/format';

/**
 * Affichage d'un prix.
 *
 * Le montant est composé en Sun Motter (police de titrage de la charte) mais le
 * symbole « € » en Manrope : Sun Motter ne contient pas de glyphe euro, et un
 * repli automatique du navigateur donnerait une police système hors charte.
 */
export function Price({
  cents,
  unit,
  className = '',
  unitClassName = '',
}: {
  cents: number;
  unit?: string;
  className?: string;
  unitClassName?: string;
}) {
  const [amount] = formatPrice(cents).split(' €');

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-display leading-none">{amount}</span>
      <span className="font-sans font-bold leading-none">€</span>
      {unit && <span className={`font-sans font-normal ${unitClassName}`}>{unit}</span>}
    </span>
  );
}
