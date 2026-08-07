import { useEffect, useState } from 'react'
import { db } from '../data/db'

export function CachedImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src?.startsWith('local-media:')) return src ? <img src={src} alt={alt ?? ''} {...props} /> : null
  return <LocalImage mediaId={src.slice('local-media:'.length)} alt={alt} {...props} />
}

function LocalImage({ mediaId, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { mediaId: string }) {
  const [resolved, setResolved] = useState<string>()
  useEffect(() => {
    let objectUrl: string | undefined
    db.media.get(mediaId).then((media) => {
      if (media?.blob) { objectUrl = URL.createObjectURL(media.blob); setResolved(objectUrl) }
    })
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [mediaId])
  return resolved ? <img src={resolved} alt={alt ?? ''} {...props} /> : null
}
