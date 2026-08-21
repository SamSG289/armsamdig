import type { BodyGender } from '../types/wardrobe'

interface Props {
  className?: string
  genero?: BodyGender
  // Factores de escala derivados del perfil corporal (ver
  // src/lib/sizing.ts computeBodyScale). 1 = proporciones "promedio".
  heightScale?: number
  widthScale?: number
}

// Silueta 2D de un cuerpo humano de frente, usada como referencia visual
// en el armador de outfits para que las prendas se ubiquen sobre la zona
// del cuerpo que corresponde (cabeza, torso, piernas, pies...).
// viewBox 0 0 300 400 (proporción 3:4, igual que el contenedor del armador)
// para que las posiciones en % de src/lib/outfitLayout.ts coincidan.
//
// La cabeza/cuello quedan con tamaño fijo; todo lo que está debajo de los
// hombros (torso, brazos, piernas, pies) se escala mediante un transform
// anclado en el punto de los hombros (SHOULDER_Y), usando heightScale
// (altura) y widthScale (contextura) del perfil del usuario. El mismo
// punto de anclaje se usa en src/lib/outfitLayout.ts para que la ropa
// acompañe el cambio de tamaño del cuerpo.
const CX = 150
const SHOULDER_Y = 90

interface BodyShape {
  shoulderHalf: number
  waistHalf: number
  hipHalf: number
}

const SHAPES: Record<BodyGender, BodyShape> = {
  femenino: { shoulderHalf: 48, waistHalf: 32, hipHalf: 52 },
  masculino: { shoulderHalf: 64, waistHalf: 52, hipHalf: 54 },
  neutro: { shoulderHalf: 55, waistHalf: 42, hipHalf: 48 },
}

function torsoPath({ shoulderHalf, waistHalf, hipHalf }: BodyShape): string {
  const yShoulder = SHOULDER_Y
  const yWaist = 168
  const yHip = 222
  const yHipBottom = 244
  const sL = CX - shoulderHalf
  const sR = CX + shoulderHalf
  const wL = CX - waistHalf
  const wR = CX + waistHalf
  const hL = CX - hipHalf
  const hR = CX + hipHalf
  const corner = Math.min(20, hipHalf * 0.4)

  return [
    `M${sL},${yShoulder}`,
    `C${sL - 6},${yShoulder + 46} ${wL - 6},${yWaist - 34} ${wL},${yWaist}`,
    `C${wL - 4},${yWaist + 24} ${hL},${yHip - 30} ${hL},${yHip}`,
    `Q${hL},${yHipBottom} ${hL + corner},${yHipBottom}`,
    `L${hR - corner},${yHipBottom}`,
    `Q${hR},${yHipBottom} ${hR},${yHip}`,
    `C${hR},${yHip - 30} ${wR + 4},${yWaist + 24} ${wR},${yWaist}`,
    `C${wR + 6},${yWaist - 34} ${sR + 6},${yShoulder + 46} ${sR},${yShoulder}`,
    'Z',
  ].join(' ')
}

export default function Mannequin({ className, genero = 'neutro', heightScale = 1, widthScale = 1 }: Props) {
  const shape = SHAPES[genero]
  const armX = shape.shoulderHalf + 6
  const legGap = 8
  const legHalf = shape.hipHalf - legGap / 2

  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden="true">
      <g fill="currentColor">
        {/* Cabeza y cuello: tamaño fijo, no se escalan con el cuerpo. */}
        <ellipse cx={CX} cy="42" rx="26" ry="30" />
        <rect x={CX - 12} y="66" width="24" height="24" rx="6" />

        {/* Cuerpo (hombros hacia abajo): se estira/angosta según el perfil. */}
        <g
          transform={`translate(${CX}, ${SHOULDER_Y}) scale(${widthScale}, ${heightScale}) translate(${-CX}, ${-SHOULDER_Y})`}
        >
          <ellipse cx={CX - shape.shoulderHalf - armX / 2} cy="248" rx="16" ry="18" />
          <ellipse cx={CX + shape.shoulderHalf + armX / 2} cy="248" rx="16" ry="18" />
          <rect x={CX - shape.shoulderHalf - armX} y="95" width={armX} height="150" rx={armX / 2} />
          <rect x={CX + shape.shoulderHalf} y="95" width={armX} height="150" rx={armX / 2} />
          <path d={torsoPath(shape)} />
          <rect x={CX - shape.hipHalf} y="238" width={legHalf} height="145" rx="18" />
          <rect x={CX + legGap / 2} y="238" width={legHalf} height="145" rx="18" />
          <ellipse cx={CX - shape.hipHalf + legHalf / 2} cy="388" rx={legHalf * 0.65} ry="11" />
          <ellipse cx={CX + legGap / 2 + legHalf / 2} cy="388" rx={legHalf * 0.65} ry="11" />
        </g>
      </g>
    </svg>
  )
}
