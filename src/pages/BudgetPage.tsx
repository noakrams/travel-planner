import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CollectionPage } from '../components/CollectionPage'
import { TripLayout } from '../components/TripLayout'
import type { ContentItem } from '../domain/types'

const colors = ['#68705b', '#b49a78', '#4b4339', '#bd7d68', '#7d8e96']

export default function BudgetPage() {
  return <TripLayout>{({ trip, items, editMode }) => {
    const expenses = items.filter((item) => item.kind === 'expense')
    const planned = expenses.reduce((sum, item) => sum + (item.plannedAmount ?? 0), 0)
    const actual = expenses.reduce((sum, item) => sum + (item.actualAmount ?? 0), 0)
    const data = groupByKind(expenses)
    return <>
      <section className="budget-page"><div className="collection-heading"><div><p className="eyebrow">{trip.title}</p><h2>Planned, then lived</h2><p>Costs stay in the currency you entered. Roam never changes rates behind your back.</p></div></div>
        <div className="budget-summary"><div><span>Planned</span><strong>{trip.displayCurrency} {planned.toLocaleString()}</strong></div><div><span>Actual</span><strong>{trip.displayCurrency} {actual.toLocaleString()}</strong></div><div><span>Remaining</span><strong>{trip.displayCurrency} {(planned - actual).toLocaleString()}</strong></div></div>
        <div className="budget-visual"><div className="chart-wrap" aria-hidden="true"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={105} paddingAngle={2}>{data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => `${trip.displayCurrency} ${Number(value).toLocaleString()}`} /><Legend /></PieChart></ResponsiveContainer><div className="chart-center"><small>spent</small><strong>{actual ? Math.round((actual / Math.max(planned, 1)) * 100) : 0}%</strong></div></div>
          <table><caption>Budget by category</caption><thead><tr><th>Category</th><th>Planned</th><th>Actual</th></tr></thead><tbody>{data.map((entry) => <tr key={entry.name}><th>{entry.name}</th><td>{trip.displayCurrency} {entry.planned.toLocaleString()}</td><td>{trip.displayCurrency} {entry.value.toLocaleString()}</td></tr>)}</tbody></table></div>
      </section>
      <CollectionPage trip={trip} items={expenses} kinds={['expense']} title="Expenses" intro="Keep planned and actual amounts together without automatic exchange-rate changes." editMode={editMode} />
    </>
  }}</TripLayout>
}

function groupByKind(items: ContentItem[]) {
  const grouped = new Map<string, { name: string; value: number; planned: number }>()
  for (const item of items) {
    const name = item.kind[0].toUpperCase() + item.kind.slice(1)
    const current = grouped.get(name) ?? { name, value: 0, planned: 0 }
    current.value += item.actualAmount ?? 0; current.planned += item.plannedAmount ?? 0; grouped.set(name, current)
  }
  return Array.from(grouped.values())
}
