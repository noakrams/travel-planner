import { CollectionPage } from '../components/CollectionPage'
import { TripLayout } from '../components/TripLayout'

export function BookingsPage() {
  return <TripLayout>{({ trip, items, editMode }) => <CollectionPage trip={trip} items={items} kinds={['booking', 'stay', 'transport']} title="Bookings" intro="The fixed points: where you sleep, how you move, and what needs a confirmation." editMode={editMode} />}</TripLayout>
}
