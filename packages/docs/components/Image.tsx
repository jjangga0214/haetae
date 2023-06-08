interface ImageProps {
  src: string
  alt: string
}

export default function Image({ src, alt }: ImageProps): JSX.Element {
  return (
    <>
      <br />
      <img src={src} alt={alt} />
    </>
  )
}
