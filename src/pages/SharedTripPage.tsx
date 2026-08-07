import { TripLayout } from '../components/TripLayout'
import { BidiText } from '../components/BidiText'
import { ItineraryCard } from '../components/ItineraryCard'

export function SharedTripPage() {
  return <TripLayout readOnly>{({ days, items }) => <section className="shared-plan"><p className="eyebrow">Shared itinerary</p><h2>Day by day</h2>{days.map((day) => <section key={day.id}><BidiText as="h3" value={day.title}>{day.title}</BidiText><BidiText as="p" value={day.summary}>{day.summary}</BidiText><div className="shared-items">{items.filter((item) => item.dayId === day.id).map((item) => <ItineraryCard key={item.id} item={{ ...item, confirmationCode: undefined }} editMode={false} onEdit={() => {}} onDuplicate={() => {}} onMove={() => {}} onDelete={() => {}} />)}</div></section>)}</section>}</TripLayout>
}
