import { useRef, useEffect } from 'react'
import styled from '@emotion/styled'

interface Children {
  children: JSX.Element[]
}

interface Options extends Children {
  tokens: string[]
}

const A = styled.a`
  text-decoration: inherit;
  color: inherit;
`

export default function TokenLinkCode({
  children,
  tokens,
}: Options): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  // Let's Change something inside the post
  useEffect(() => {
    const container = containerRef?.current

    const allTokens = container?.querySelectorAll('code > .line > span')

    for (const token of allTokens || []) {
      const textContent = token?.textContent?.trim()
      if (tokens.includes(textContent as string)) {
        token.innerHTML = `<a href="#${textContent?.toLowerCase()}" style=" color: inherit; cursor: pointer;">${
          token.textContent
        }</a>`
      }
    }
    // console.log(container?.children) // This will be a list of child nodes
    // console.log(_tokens)
  }, [children, tokens, containerRef])

  return <div ref={containerRef}>{children}</div>
}
