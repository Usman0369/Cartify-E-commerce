const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" {...base} />
      <path d="m20 20-3.4-3.4" {...base} />
    </svg>
  )
}

export function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6" {...base} />
      <circle cx="9.5" cy="19" r="1.3" {...base} />
      <circle cx="17.5" cy="19" r="1.3" {...base} />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.4" {...base} />
      <path d="M5.2 20c.6-3.5 3.3-5.7 6.8-5.7s6.2 2.2 6.8 5.7" {...base} />
    </svg>
  )
}

export function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" {...base} />
    </svg>
  )
}

export function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m6 6 12 12M18 6 6 18" {...base} />
    </svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 12h15M14 7l5 5-5 5" {...base} />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 7h16M9 7V4.8h6V7M7 7l1 13h8l1-13" {...base} />
      <path d="M10 11v5M14 11v5" {...base} />
    </svg>
  )
}

export function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 20.3S4.5 15.7 4.5 9.9A4.4 4.4 0 0 1 12 6.8a4.4 4.4 0 0 1 7.5 3.1c0 5.8-7.5 10.4-7.5 10.4z"
        {...base}
      />
    </svg>
  )
}

export function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.6z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

export function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 6h10v10H3zM13 9h4l3 3v4h-7" {...base} />
      <circle cx="7" cy="17.5" r="1.6" {...base} />
      <circle cx="17" cy="17.5" r="1.6" {...base} />
    </svg>
  )
}

export function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 3l7 2.8v5.5c0 4.3-2.9 7.5-7 9.7-4.1-2.2-7-5.4-7-9.7V5.8L12 3z" {...base} />
      <path d="m9 12 2.1 2.1L15.4 10" {...base} />
    </svg>
  )
}

export function ReturnIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 9h11a5 5 0 0 1 0 10h-4" {...base} />
      <path d="M8 5 4 9l4 4" {...base} />
    </svg>
  )
}

export function SupportIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" {...base} />
      <path d="M4 13h2.5v6H6a2 2 0 0 1-2-2v-4zM20 13h-2.5v6H18a2 2 0 0 0 2-2v-4z" {...base} />
      <path d="M17.5 19c0 1.2-1.3 2-3 2h-1" {...base} />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" {...base} />
    </svg>
  )
}

export function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" {...base} />
      <path d="M12 7.5V12l3 2" {...base} />
    </svg>
  )
}

export function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" {...base} />
      <path d="m4 7 8 6 8-6" {...base} />
    </svg>
  )
}

export function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M7 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5L16 12.5 20 14v3a2 2 0 0 1-2.2 2A15.8 15.8 0 0 1 5 6.2 2 2 0 0 1 7 4z" {...base} />
    </svg>
  )
}

export function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" {...base} />
      <circle cx="12" cy="11" r="2.2" {...base} />
    </svg>
  )
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...base} />
      <circle cx="12" cy="12" r="4" {...base} />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M14.5 8.2V6.5c0-.8.4-1.1 1.2-1.1h1.6V2.6h-2.6c-2.5 0-3.9 1.5-3.9 3.9v1.7H8.5v2.9h2.3V21h3.7v-9.9h2.6l.4-2.9h-3z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4 4l16 16M20 4 4 20" {...base} />
    </svg>
  )
}
