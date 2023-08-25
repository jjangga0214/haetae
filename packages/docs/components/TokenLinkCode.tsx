import { t } from 'nextra/dist/types-fa5ec8b0'
import { useRef, useEffect } from 'react'

interface Children {
  children: JSX.Element[]
}

interface TokenLinkCodeProps extends Children {
  tokens: (string | Record<string, string>)[] | Record<string, string>
  // eslint-disable-next-line react/require-default-props
  inline?: boolean
}

export default function TokenLinkCode({
  children,
  tokens,
  inline = false,
}: TokenLinkCodeProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  if (!Array.isArray(tokens)) {
    // eslint-disable-next-line no-param-reassign
    tokens = [tokens]
  }
  // Let's Change something inside the post
  useEffect(() => {
    let tokenLinkMap: Record<string, string> = {}
    for (const tokenOrObj of tokens as (string | Record<string, string>)[]) {
      if (typeof tokenOrObj === 'string') {
        tokenLinkMap[tokenOrObj] = `#${tokenOrObj.toLowerCase()}`
      } else {
        tokenLinkMap = { ...tokenLinkMap, ...tokenOrObj }
      }
    }

    const container = containerRef?.current
    const allTokenElements = container?.querySelectorAll('code > .line > span')

    for (const element of allTokenElements || []) {
      const textContent = element?.textContent?.trim()
      const link = tokenLinkMap[textContent as string]
      if (link) {
        let textContent: string | undefined | null = element?.textContent
        if (!textContent) {
          // eslint-disable-next-line no-continue
          continue
        }
        let prefix = ''
        const lTrimmed = textContent.trimStart()
        prefix += ' '.repeat(textContent.length - lTrimmed.length)
        textContent = lTrimmed
        if (textContent?.startsWith('.')) {
          prefix += '.'
          textContent = textContent?.slice('.'.length)
        }
        element.innerHTML = `${prefix}<a href="${link}" style=" color: inherit; text-decoration: underline; cursor: pointer;">${textContent}</a>`
      }
    }
  }, [children, tokens, containerRef])
  if (inline) {
    return (
      <span ref={containerRef} style={{ marginTop: '2em' }}>
        {children}
      </span>
    )
  }
  return (
    <div ref={containerRef} style={{ marginTop: '2em' }}>
      {children}
    </div>
  )
}
