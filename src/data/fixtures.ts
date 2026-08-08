import type { ContentItem, Trip, TripDay } from '../domain/types'

const createdAt = '2026-08-01T10:00:00.000Z'
const base = { createdAt, updatedAt: createdAt, version: 1 }
const fixtureImage = (name: string) => `${import.meta.env.BASE_URL}images/${name}`

export const fixtureTrips: Trip[] = [
  {
    ...base,
    id: 'trip-portugal-2026',
    ownerId: 'local-owner',
    title: 'Portugal, slowly',
    subtitle: 'Lisbon tiles, Atlantic air, and the train north',
    startDate: '2026-10-08',
    endDate: '2026-10-17',
    timezone: 'Europe/Lisbon',
    baseCurrency: 'EUR',
    displayCurrency: 'EUR',
    budgetAmount: 3500,
    budgetCurrency: 'EUR',
    categoryBudgets: { accommodation: 1200, transportation: 1100, food: 700, activities: 350, shopping: 100, other: 50 },
    coverUrl: fixtureImage('lisbon-street.jpg'),
    coverAlt: 'Lisbon rooftops descending toward the Tagus river',
    status: 'upcoming',
    shareEnabled: false
  },
  {
    ...base,
    id: 'trip-japan-2026',
    ownerId: 'local-owner',
    title: 'Japan 2026',
    subtitle: 'Tokyo, a mountain, Kyoto, and back again',
    startDate: '2026-09-18',
    endDate: '2026-10-02',
    timezone: 'Asia/Tokyo',
    baseCurrency: 'JPY',
    displayCurrency: 'JPY',
    budgetAmount: 900000,
    budgetCurrency: 'JPY',
    categoryBudgets: { accommodation: 350000, transportation: 200000, food: 150000, activities: 100000, shopping: 50000, other: 50000 },
    coverUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1800&q=82',
    coverAlt: 'Tokyo avenue at dusk with illuminated signs',
    status: 'upcoming',
    shareEnabled: false
  }
]

export const fixtureDays: TripDay[] = [
  { ...base, id: 'day-lisbon-1', tripId: 'trip-portugal-2026', date: '2026-10-08', title: 'Arrival in Lisbon', summary: 'Check in, stretch your legs, and let the city come to you.', position: 0 },
  { ...base, id: 'day-lisbon-2', tripId: 'trip-portugal-2026', date: '2026-10-09', title: 'The city of seven hills', summary: 'Alfama early, Baixa at lunch, and a sunset above the rooftops.', position: 1 },
  { ...base, id: 'day-lisbon-3', tripId: 'trip-portugal-2026', date: '2026-10-10', title: 'Belém and the river', summary: 'A light museum day with plenty of room for the waterfront.', position: 2 },
  { ...base, id: 'day-japan-1', tripId: 'trip-japan-2026', date: '2026-09-18', title: 'Arrive — and nothing else', summary: 'Narita 18:25 → Shibuya ≈ 21:00. By your own call: no plans.', position: 0 },
  { ...base, id: 'day-japan-2', tripId: 'trip-japan-2026', date: '2026-09-19', title: 'Shibuya on foot — the jet-lag day', summary: 'Everything today is walkable from the hotel. Sleep in, then a gentle loop of your own neighbourhood, ending on the roof at sunset.', position: 1 },
  { ...base, id: 'day-japan-3', tripId: 'trip-japan-2026', date: '2026-09-20', title: 'Harajuku by day, Shinjuku by night', summary: 'A shrine and neighborhood walk followed by Tokyo’s most atmospheric night out.', position: 2 },
  { ...base, id: 'day-japan-4', tripId: 'trip-japan-2026', date: '2026-09-21', title: 'teamLab, Tokyo Tower, and the Ginza splurge', summary: 'A relaxed morning, then the immersive-art centrepiece into a dressed-up Ginza evening.', position: 3 },
  { ...base, id: 'day-japan-5', tripId: 'trip-japan-2026', date: '2026-09-22', title: 'The east loop — Asakusa, Akihabara, and an easy last night', summary: 'Start early for the two crowd-sensitive walk-ins, done in one tidy eastward line, then keep the evening light before the Nikko move.', position: 4 }
]

export const fixtureItems: ContentItem[] = [
  {
    ...base,
    id: 'item-arrive', tripId: 'trip-portugal-2026', dayId: 'day-lisbon-1', kind: 'transport',
    title: 'Arrive at Humberto Delgado Airport', description: 'Take the metro or a taxi into the city. Keep the first evening soft.',
    startTime: '17:40', location: 'Lisbon Airport', mapsUrl: 'https://maps.google.com/?q=Lisbon+Airport', position: 0,
    imageUrl: fixtureImage('lisbon-arrival.jpg'), imageAlt: 'City buildings seen from above in warm evening light'
  },
  {
    ...base,
    id: 'item-checkin', tripId: 'trip-portugal-2026', dayId: 'day-lisbon-1', kind: 'stay',
    title: 'Check in at Memmo Alfama', description: 'Drop the bags. Ask for the quiet room facing the courtyard.',
    startTime: '19:15', location: 'Alfama', provider: 'Memmo Hotels', status: 'confirmed', position: 1
  },
  {
    ...base,
    id: 'item-walk', tripId: 'trip-portugal-2026', dayId: 'day-lisbon-1', kind: 'activity',
    title: 'Miradouro at blue hour', description: 'A short walk to settle into the neighborhood. No checklist, just the view.',
    startTime: '20:30', location: 'Miradouro de Santa Luzia', mapsUrl: 'https://maps.google.com/?q=Miradouro+de+Santa+Luzia', position: 2
  },
  {
    ...base,
    id: 'item-alfama', tripId: 'trip-portugal-2026', dayId: 'day-lisbon-2', kind: 'activity',
    title: 'Alfama before the streets fill', description: 'Follow the tiled lanes downhill. Stop when the light is good.',
    startTime: '08:00', location: 'Alfama', position: 0,
    imageUrl: fixtureImage('lisbon-street.jpg'), imageAlt: 'Narrow tiled street in Lisbon'
  },
  {
    ...base,
    id: 'item-hebrew', tripId: 'trip-portugal-2026', dayId: 'day-lisbon-2', kind: 'note',
    title: 'תזכורת לערב', description: 'להזמין מקום ב־Prado בשעה 20:30 ולבדוק את הדרך מהמלון.', startTime: '12:00', position: 1
  },
  {
    ...base,
    id: 'item-dinner', tripId: 'trip-portugal-2026', kind: 'booking', title: 'Dinner at Prado',
    description: 'Window table requested. Vegetarian tasting menu available.', startTime: '20:30', provider: 'Prado',
    confirmationCode: 'LIS-4821', status: 'confirmed', position: 0, plannedAmount: 120, currency: 'EUR', budgetCategory: 'food'
  },
  {
    ...base,
    id: 'item-hotel', tripId: 'trip-portugal-2026', kind: 'stay', title: 'Memmo Alfama',
    description: 'Five nights, breakfast included.', location: 'Alfama', provider: 'Memmo Hotels', status: 'confirmed',
    position: 1, plannedAmount: 940, currency: 'EUR', budgetCategory: 'accommodation'
  },
  {
    ...base,
    id: 'item-train', tripId: 'trip-portugal-2026', kind: 'transport', title: 'Alfa Pendular to Porto',
    description: 'Seats 8A and 8B. Arrive 20 minutes early.', provider: 'Comboios de Portugal', status: 'confirmed',
    position: 2, plannedAmount: 68, currency: 'EUR', budgetCategory: 'transportation'
  },
  {
    ...base,
    id: 'item-route-lisbon', tripId: 'trip-portugal-2026', kind: 'route', title: 'Lisbon', description: '4 nights', location: 'Lisbon', position: 0,
    mapsUrl: 'https://maps.google.com/?q=Lisbon'
  },
  { ...base, id: 'item-route-coimbra', tripId: 'trip-portugal-2026', kind: 'route', title: 'Coimbra', description: '1 night', location: 'Coimbra', position: 1, mapsUrl: 'https://maps.google.com/?q=Coimbra' },
  { ...base, id: 'item-route-porto', tripId: 'trip-portugal-2026', kind: 'route', title: 'Porto', description: '4 nights', location: 'Porto', position: 2, mapsUrl: 'https://maps.google.com/?q=Porto' },
  { ...base, id: 'item-food', tripId: 'trip-portugal-2026', kind: 'food', title: 'Taberna da Rua das Flores', description: 'Small plates; join the queue before opening.', location: 'Chiado', position: 0 },
  { ...base, id: 'item-place', tripId: 'trip-portugal-2026', kind: 'place', title: 'Museu Nacional do Azulejo', description: 'Allow two hours and leave time for the cloister.', location: 'Lisbon', position: 0 },
  { ...base, id: 'item-warning', tripId: 'trip-portugal-2026', kind: 'warning', title: 'Steep streets after rain', description: 'The calçada stones become slippery. Wear shoes with grip.', position: 0 },
  { ...base, id: 'item-note', tripId: 'trip-portugal-2026', kind: 'note', title: 'Packing note', description: 'Light rain layer, small day bag, and room for ceramics.', position: 0 },
  { ...base, id: 'expense-flight', tripId: 'trip-portugal-2026', kind: 'expense', title: 'Flights', description: 'Round trip for two', position: 8, plannedAmount: 900, currency: 'EUR', budgetCategory: 'transportation', paid: true, occurredOn: '2026-07-12' },
  { ...base, id: 'expense-food', tripId: 'trip-portugal-2026', kind: 'expense', title: 'Food allowance', description: 'Daily shared budget', position: 9, plannedAmount: 650, currency: 'EUR', budgetCategory: 'food', paid: false },
  { ...base, id: 'japan-arrival', tripId: 'trip-japan-2026', dayId: 'day-japan-1', kind: 'transport', title: 'Land at Narita Airport', description: 'Take the Narita Express directly to Shibuya, about 75 minutes. A taxi from Narita is not worth the cost after the long flight.', startTime: '18:25', location: 'Narita International Airport', status: 'confirmed', position: 0, plannedAmount: 6500, currency: 'JPY', budgetCategory: 'transportation' },
  { ...base, id: 'japan-checkin-shibuya', tripId: 'trip-japan-2026', dayId: 'day-japan-1', kind: 'stay', title: 'Check in at all day place shibuya', description: 'No plans tonight. Use the ground-floor bakery-bar or a nearby late-night ramen counter only if hungry.', startTime: '21:00', location: 'Shibuya', status: 'recommended', position: 1, plannedAmount: 128000, currency: 'JPY', budgetCategory: 'accommodation' },

  { ...base, id: 'japan-hikiniku-crossing', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'food', title: 'Hikiniku to Come, then Shibuya Crossing', description: 'Register online for the 11:00 seating. The fixed hamburger-steak set has no chicken or vegetable substitute; meet at Hachikō afterwards if Noa has brunch elsewhere.', startTime: '11:00', location: 'Shibuya', status: 'register', position: 0 },
  { ...base, id: 'japan-parco', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'place', title: 'Nintendo Tokyo, Pokémon Center, and Jump Shop', description: 'All three are on Shibuya PARCO’s sixth floor. Expect a queue during Silver Week.', startTime: '13:00', location: 'Shibuya PARCO', status: 'recommended', position: 1 },
  { ...base, id: 'japan-miyashita', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'place', title: 'Pause on the Miyashita Park roof', description: 'Coffee, greenery, seating, and a skate park above the busy streets—a low-effort jet-lag break.', startTime: '15:00', location: 'Miyashita Park', status: 'recommended', position: 2 },
  { ...base, id: 'japan-shibuya-sky', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'booking', title: 'Shibuya Sky at sunset', description: 'Open-air 360° views as daylight fades and the city switches on below.', startTime: '16:45', location: 'Shibuya Scramble Square', status: 'booked', position: 3, plannedAmount: 6000, currency: 'JPY', budgetCategory: 'activities' },
  { ...base, id: 'japan-shibuya-yokocho', tripId: 'trip-japan-2026', dayId: 'day-japan-2', kind: 'food', title: 'Shibuya Yokochō and Nonbei Yokochō', description: 'Dinner in the lively regional food alley, then a nightcap in the tiny postwar bar lane beside the JR tracks.', startTime: '19:00', location: 'Shibuya', status: 'recommended', position: 4 },

  { ...base, id: 'japan-meiji-jingu', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'place', title: 'Meiji Jingū before the crowds', description: 'Walk through the forested approach to the Shintō shrine. Go early enough to keep the holiday morning serene.', startTime: '09:30', location: 'Meiji Jingū', status: 'must-do', position: 0 },
  { ...base, id: 'japan-harajuku-walk', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'activity', title: 'Takeshita Street, Cat Street, and Omotesandō', description: 'Move from colorful youth fashion to calmer back lanes and architecture, finishing at Iyoshi Cola when it opens at 13:00.', startTime: '11:00', location: 'Harajuku', status: 'recommended', position: 1 },
  { ...base, id: 'japan-mensho', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'food', title: 'Lunch at Jikasei MENSHO', description: 'A reliable fish-free choice near home with vegan ramen and chicken paitan.', startTime: '13:30', location: 'Shibuya PARCO', status: 'recommended', position: 2 },
  { ...base, id: 'japan-yoyogi-shimokita', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'activity', title: 'Choose Yoyogi Park or Shimokitazawa', description: 'Pick Yoyogi for rest and greenery, or Shimokitazawa for vintage shops and low-key cafés.', startTime: '15:00', location: 'Tokyo', status: 'optional', position: 3 },
  { ...base, id: 'japan-omoide', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'food', title: 'Yakitori in Omoide Yokochō', description: 'A compact, atmospheric postwar alley. Chicken skewers, karaage, and tamago are the straightforward options.', startTime: '18:30', location: 'Shinjuku', status: 'recommended', position: 4 },
  { ...base, id: 'japan-shinjuku-night', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'food', title: 'Shinjuku view, Bar B&F, and Golden Gai', description: 'Start with the free Metropolitan Government Building deck. Continue to Bar B&F around 21:30 if booked, then try one or two tourist-friendly Golden Gai bars.', startTime: '20:00', location: 'Shinjuku', status: 'recommended', position: 5 },
  { ...base, id: 'japan-golden-gai-warning', tripId: 'trip-japan-2026', dayId: 'day-japan-3', kind: 'warning', title: 'Golden Gai etiquette', description: 'Many bars seat only 5–8 and charge a ¥500–2,000 cover. Choose doors with an English menu or tourists-welcome sign and skip regulars-only rooms.', position: 6 },

  { ...base, id: 'japan-slow-morning', tripId: 'trip-japan-2026', dayId: 'day-japan-4', kind: 'note', title: 'Keep the morning empty', description: 'Sleep, coffee, or wander without an agenda. Nothing is scheduled before the afternoon slot on purpose.', startTime: '11:00', status: 'recommended', position: 0 },
  { ...base, id: 'japan-teamlab', tripId: 'trip-japan-2026', dayId: 'day-japan-4', kind: 'booking', title: 'teamLab Borderless', description: 'Allow 2–3 hours for the mapless immersive galleries. The artworks move between spaces and respond to visitors.', startTime: '14:00', location: 'Azabudai Hills', status: 'booked', position: 1, plannedAmount: 9600, currency: 'JPY', budgetCategory: 'activities' },
  { ...base, id: 'japan-tokyo-tower', tripId: 'trip-japan-2026', dayId: 'day-japan-4', kind: 'place', title: 'Tokyo Tower at dusk', description: 'See the tower light up from the Azabudai Hills gardens for free; go up only if the queue is short.', startTime: '17:15', location: 'Tokyo Tower', status: 'recommended', position: 2 },
  { ...base, id: 'japan-bird-land', tripId: 'trip-japan-2026', dayId: 'day-japan-4', kind: 'booking', title: 'Yakitori omakase at Bird Land', description: 'A booked all-chicken dinner in Ginza, turning charcoal-grilled skewers into a refined omakase meal.', startTime: '19:00', location: 'Ginza', status: 'booked', position: 3 },
  { ...base, id: 'japan-centifolia', tripId: 'trip-japan-2026', dayId: 'day-japan-4', kind: 'booking', title: 'A final cocktail at Bar Centifolia', description: 'Reserve around 21:15–21:30 and allow up to 90 minutes for one of the theatrical signature cocktails.', startTime: '21:15', location: 'Azabu-Jūban', status: 'reserve', position: 4 },

  { ...base, id: 'japan-sensoji', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'place', title: 'Sensō-ji at opening', description: 'See Kaminarimon and Nakamise before 08:00, while the approach is quiet and the light is good.', startTime: '07:45', location: 'Asakusa', status: 'must-do', position: 0 },
  { ...base, id: 'japan-skytree', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'place', title: 'Tokyo Skytree and Solamachi', description: 'Optional timed observation deck, Pokémon Center, and shops—or simply photograph the tower from Asakusa and continue.', startTime: '09:30', location: 'Tokyo Skytree', status: 'optional', position: 1 },
  { ...base, id: 'japan-akihabara', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'activity', title: 'Akihabara Electric Town', description: 'Browse GiGO or Taito HEY, Super Potato, Gachapon Hall, and Yodobashi Akiba. The dense signs and themed stores are the spectacle.', startTime: '11:30', location: 'Akihabara', status: 'recommended', position: 2 },
  { ...base, id: 'japan-casual-dinner', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'food', title: 'Easy dinner back in Shibuya', description: 'Choose CoCo Ichibanya curry, a chicken-katsu counter, or the Tokyu Food Show. Pack for the next morning’s move.', startTime: '18:30', location: 'Shibuya', status: 'recommended', position: 3 },
  { ...base, id: 'japan-last-drink', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'food', title: 'One last drink near the hotel', description: 'Try The SG Club or Bellovisto only if energy allows. Keep it early before tomorrow’s departure.', startTime: '21:00', location: 'Shibuya', status: 'optional', position: 4 },
  { ...base, id: 'japan-east-loop-warning', tripId: 'trip-japan-2026', dayId: 'day-japan-5', kind: 'warning', title: 'Silver Week crowd plan', description: 'The 07:45 start matters. Keep Asakusa → Akihabara as one eastward chain and preserve the soft evening.', position: 5 }
]
