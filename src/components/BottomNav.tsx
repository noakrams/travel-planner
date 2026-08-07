import { CalendarDots } from '@phosphor-icons/react/CalendarDots'
import { House } from '@phosphor-icons/react/House'
import { Receipt } from '@phosphor-icons/react/Receipt'
import { SuitcaseRolling } from '@phosphor-icons/react/SuitcaseRolling'
import { DotsThreeCircle } from '@phosphor-icons/react/DotsThreeCircle'
import { NavLink, useParams } from 'react-router-dom'

const nav = [
  { key: 'trips', label: 'Trips', icon: House, path: '/' },
  { key: 'plan', label: 'Plan', icon: CalendarDots, path: '' },
  { key: 'bookings', label: 'Bookings', icon: SuitcaseRolling, path: '/bookings' },
  { key: 'budget', label: 'Budget', icon: Receipt, path: '/budget' },
  { key: 'more', label: 'More', icon: DotsThreeCircle, path: '/more' }
]

export function BottomNav() {
  const { tripId } = useParams()
  return <nav className="bottom-nav" aria-label="Primary navigation">{nav.map(({ key, label, icon: Icon, path }) => {
    const to = key === 'trips' || !tripId ? '/' : `/trip/${tripId}${path}`
    return <NavLink key={key} to={to} end={key === 'trips' || key === 'plan'}><Icon size={22} weight="regular" aria-hidden="true" /><span>{label}</span></NavLink>
  })}</nav>
}
