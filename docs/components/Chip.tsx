import { Chip as MuiChip } from '@mui/material'

interface ChipProps {
  label: string
  href: string
}

export default function Chip({ label, href }: ChipProps): JSX.Element {
  return (
    <MuiChip
      label={label}
      color="primary"
      size="small"
      variant="outlined"
      component="a"
      href={href}
      clickable
    />
  )
}
