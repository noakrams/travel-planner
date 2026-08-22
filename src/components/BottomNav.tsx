import { CalendarDots } from '@phosphor-icons/react/CalendarDots'
import { House } from '@phosphor-icons/react/House'
import { Receipt } from '@phosphor-icons/react/Receipt'
import { SuitcaseRolling } from '@phosphor-icons/react/SuitcaseRolling'
import { MapTrifold } from '@phosphor-icons/react/MapTrifold'
import { NavLink, useParams } from 'react-router-dom'

const nav = [
  { key: 'trips', label: 'Trips', icon: House, path: '/' },
  { key: 'plan', label: 'Plan', icon: CalendarDots, path: '' },
  { key: 'map', label: 'Map', icon: MapTrifold, path: '/map' },
  { key: 'bookings', label: 'Bookings', icon: SuitcaseRolling, path: '/bookings' },
  { key: 'budget', label: 'Budget', icon: Receipt, path: '/budget' }
]

export function BottomNav() {
  const { tripId } = useParams()
  return <nav className="bottom-nav" aria-label="Primary navigation">{nav.map(({ key, label, icon: Icon, path }) => {
    const to = key === 'trips' || !tripId ? '/' : `/trip/${tripId}${path}`
    return <NavLink key={key} to={to} end={key === 'trips' || key === 'plan'} aria-label={label}><Icon size={22} weight="regular" aria-hidden="true" /><span>{label}</span></NavLink>
  })}</nav>
}
