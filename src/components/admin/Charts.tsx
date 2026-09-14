'use client';

import { useId } from 'react';

/**
 * Graphiques en SVG pur, sans librairie.
 *
 * Trois raisons à ce choix :
 *  - le poids : aucune dépendance supplémentaire dans le bundle ;
 *  - la charte : les couleurs et les formes sont celles de la marque, sans
 *    avoir à surcharger le thème d'une librairie ;
 *  - l'adaptativité : un `viewBox` se redimensionne tout seul, du téléphone au
 *    grand écran, sans recalcul JavaScript au redimensionnement.
 *
 * Chaque graphique est doublé d'un tableau lisible par les lecteurs d'écran :
 * une courbe seule n'est pas accessible.
 */

export interface Point {
  label: string;
  value: number;
  /** Libellé lisible de la valeur (montant formaté, pourcentage…). */
  display?: string;
}

const PALETTE = ['#e26129', '#439677', '#69acde', '#59443a'] as const;

function DataTable({ caption, points }: { caption: string; points: Point[] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {points.map((p) => (
          <tr key={p.label}>
            <th scope="row">{p.label}</th>
            <td>{p.display ?? p.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Histogramme vertical. Les libellés sont pivotés quand ils sont nombreux. */
export function BarChart({
  points,
  caption,
  height = 180,
  color = PALETTE[0],
}: {
  points: Point[];
  caption: string;
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = Math.max(points.length * 46, 320);
  const barWidth = width / points.length;
  const plot = height - 30;

  return (
    <figure className="m-0 flex flex-col gap-1">
      {/* Pas de `preserveAspectRatio="none"` : une mise à l'échelle non uniforme
          déformerait les libellés de l'axe. La hauteur suit donc le rapport du
          viewBox, ce qui reste net à toutes les largeurs. */}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={caption} className="h-auto w-full">
        {/* Lignes de repère à 0, 50 et 100 % du maximum */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={plot - plot * ratio}
            y2={plot - plot * ratio}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {points.map((point, i) => {
          const h = (point.value / max) * plot;
          return (
            <g key={point.label}>
              <rect
                x={i * barWidth + barWidth * 0.18}
                y={plot - h}
                width={barWidth * 0.64}
                height={Math.max(h, point.value > 0 ? 2 : 0)}
                rx="3"
                fill={color}
              >
                <title>{`${point.label} : ${point.display ?? point.value}`}</title>
              </rect>
              {/* Au-delà de dix barres, un libellé sur deux : sinon ils se chevauchent. */}
              {(points.length <= 10 || i % 2 === 0) && (
                <text
                  x={i * barWidth + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  fillOpacity="0.5"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <DataTable caption={caption} points={points} />
    </figure>
  );
}

/** Courbe d'évolution avec aire dégradée. */
export function AreaChart({
  points,
  caption,
  color = PALETTE[0],
}: {
  points: Point[];
  caption: string;
  color?: string;
}) {
  const gradientId = useId();
  const width = 600;
  const height = 200;
  const plot = height - 28;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((p, i) => [i * step, plot - (p.value / max) * (plot - 10)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${plot} L0,${plot} Z`;

  return (
    <figure className="m-0 flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={caption} className="h-48 w-full sm:h-56">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={plot - (plot - 10) * ratio}
            y2={plot - (plot - 10) * ratio}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={points[i].label} cx={x} cy={y} r="3.5" fill={color}>
            <title>{`${points[i].label} : ${points[i].display ?? points[i].value}`}</title>
          </circle>
        ))}
        {points.map((p, i) =>
          // Un libellé sur deux quand la série est dense, pour rester lisible.
          i % Math.ceil(points.length / 6) === 0 ? (
            <text key={p.label} x={i * step} y={height - 6} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.5">
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
      <DataTable caption={caption} points={points} />
    </figure>
  );
}

/** Répartition en anneau. */
export function DonutChart({
  points,
  caption,
  centerLabel,
  centerValue,
}: {
  points: Point[];
  caption: string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="m-0 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg viewBox="0 0 140 140" role="img" aria-label={caption} className="size-36 shrink-0">
        <g transform="rotate(-90 70 70)">
          {points.map((point, i) => {
            const fraction = point.value / total;
            const dash = fraction * circumference;
            const element = (
              <circle
                key={point.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{`${point.label} : ${point.display ?? point.value}`}</title>
              </circle>
            );
            offset += dash;
            return element;
          })}
        </g>
        {centerValue && (
          <>
            <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
              {centerValue}
            </text>
            <text x="70" y="84" textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.55">
              {centerLabel}
            </text>
          </>
        )}
      </svg>

      <ul className="flex w-full flex-col gap-2">
        {points.map((point, i) => (
          <li key={point.label} className="flex items-center justify-between gap-3 text-[length:var(--text-sm)]">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate text-anthracite/70">{point.label}</span>
            </span>
            <span className="shrink-0 font-semibold">{point.display ?? point.value}</span>
          </li>
        ))}
      </ul>
      <DataTable caption={caption} points={points} />
    </figure>
  );
}

/** Jauge circulaire — utilisée pour le taux de remplissage. */
export function Gauge({ ratio, label, className = '' }: { ratio: number; label: string; className?: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));

  return (
    <figure className={`m-0 flex flex-col items-center gap-2 ${className}`}>
      <svg viewBox="0 0 110 110" role="img" aria-label={`${label} : ${Math.round(clamped * 100)} %`} className="size-28">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="12" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke={clamped > 0.75 ? '#439677' : clamped > 0.4 ? '#e26129' : '#69acde'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${clamped * circumference} ${circumference}`}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <text x="55" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
          {Math.round(clamped * 100)}%
        </text>
      </svg>
      <figcaption className="text-center text-[length:var(--text-xs)] text-anthracite/60">{label}</figcaption>
    </figure>
  );
}
