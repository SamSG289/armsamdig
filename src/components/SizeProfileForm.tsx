import type { BodyGender, SizeProfile } from '../types/wardrobe'
import { CALZADO_SIZES, computeBodyScale, ROPA_SIZES } from '../lib/sizing'
import Mannequin from './Mannequin'

interface Props {
  profile: SizeProfile
  onChange: (profile: SizeProfile) => void
}

const GENERO_OPTIONS: { value: BodyGender; label: string }[] = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'neutro', label: 'Neutro' },
]

export default function SizeProfileForm({ profile, onChange }: Props) {
  const bodyScale = computeBodyScale(profile)

  return (
    <div className="grid sm:grid-cols-[1fr_180px] gap-8 max-w-2xl">
      <div>
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

          <hr className="border-neutral-800 my-1" />

          <p className="text-sm text-neutral-500 -mt-1">
            Estos datos ajustan la forma y el tamaño del maniquí, y de las prendas al armar tu
            outfit, para que se vea parecido a como te queda a vos.
          </p>

          <Field label="Género del maniquí">
            <select
              className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
              value={profile.genero}
              onChange={(e) => onChange({ ...profile, genero: e.target.value as BodyGender })}
            >
              {GENERO_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Altura (cm)">
              <input
                type="number"
                min={120}
                max={220}
                className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
                value={profile.altura}
                onChange={(e) => onChange({ ...profile, altura: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Peso (kg)">
              <input
                type="number"
                min={30}
                max={200}
                className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-white w-full"
                value={profile.peso}
                onChange={(e) => onChange({ ...profile, peso: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="aspect-[3/4] w-full rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
          <Mannequin
            genero={profile.genero}
            heightScale={bodyScale.heightScale}
            widthScale={bodyScale.widthScale}
            className="w-full h-full text-neutral-700"
          />
        </div>
        <p className="text-xs text-neutral-600 text-center">Vista previa del maniquí</p>
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
