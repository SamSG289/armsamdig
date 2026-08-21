import type { SizeProfile } from '../types/wardrobe'
import { CALZADO_SIZES, ROPA_SIZES } from '../lib/sizing'

interface Props {
  profile: SizeProfile
  onChange: (profile: SizeProfile) => void
}

export default function SizeProfileForm({ profile, onChange }: Props) {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-white mb-1">Mi perfil de tallas</h2>
      <p className="text-sm text-neutral-500 mb-5">
        Usamos estas tallas de referencia para avisarte si una prenda combina bien con el resto
        de tu outfit y para ajustar su tamaño en el armador.
      </p>
      <div className="flex flex-col gap-4">
        <Field label="Talla de ropa - parte superior (remeras, buzos, camperas, camisas)">
          <select
            className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
            value={profile.tallaSuperior}
            onChange={(e) => onChange({ ...profile, tallaSuperior: e.target.value })}
          >
            {ROPA_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Talla de ropa - parte inferior (pantalones, faldas)">
          <select
            className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
            value={profile.tallaInferior}
            onChange={(e) => onChange({ ...profile, tallaInferior: e.target.value })}
          >
            {ROPA_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Talla de calzado (EU)">
          <select
            className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
            value={profile.tallaCalzado}
            onChange={(e) => onChange({ ...profile, tallaCalzado: e.target.value })}
          >
            {CALZADO_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-neutral-300">
      {label}
      {children}
    </label>
  )
}
