import styled from '@emotion/styled'

const Small = styled.small`
  font-weight: normal !important;
`

export default function TypeOnHeadSide({
  children,
}: {
  children: JSX.Element[]
}) {
  return <Small>{children}</Small>
}
