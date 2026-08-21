interface Props {
  className?: string
}

// Silueta 2D de un cuerpo humano de frente, usada como referencia visual
// en el armador de outfits para que las prendas se ubiquen sobre la zona
// del cuerpo que corresponde (cabeza, torso, piernas, pies...).
// viewBox 0 0 300 400 (proporción 3:4, igual que el contenedor del armador)
// para que las posiciones en % de src/lib/outfitLayout.ts coincidan.
export default function Mannequin({ className }: Props) {
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="150" cy="42" rx="26" ry="30" />
        <rect x="138" y="66" width="24" height="24" rx="6" />
        <ellipse cx="75" cy="248" rx="16" ry="18" />
        <ellipse cx="225" cy="248" rx="16" ry="18" />
        <rect x="60" y="95" width="30" height="150" rx="15" />
        <rect x="210" y="95" width="30" height="150" rx="15" />
        <path d="M95,92 L205,92 L215,225 Q215,245 195,245 L105,245 Q85,245 85,225 Z" />
        <rect x="105" y="238" width="42" height="145" rx="18" />
        <rect x="153" y="238" width="42" height="145" rx="18" />
        <ellipse cx="126" cy="388" rx="26" ry="11" />
        <ellipse cx="174" cy="388" rx="26" ry="11" />
      </g>
    </svg>
  )
}
