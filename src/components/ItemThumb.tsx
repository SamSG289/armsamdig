import { useEffect, useState } from 'react'

interface Props {
  blob: Blob
  alt: string
  className?: string
}

// Convierte un Blob (imagen guardada en IndexedDB) en una URL utilizable
// por <img>, liberándola cuando el componente se desmonta o cambia el blob.
export default function ItemThumb({ blob, alt, className }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  if (!url) return <div className={className} />
  return <img src={url} alt={alt} className={className} draggable={false} />
}
