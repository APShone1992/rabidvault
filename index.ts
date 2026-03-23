import './MobileNav.css'
import { IconDashboard, IconCollection, IconSeries, IconAdd, IconReleases } from '../lib/icons'

const NAV_ITEMS = [
  { id: 'dashboard',  Icon: IconDashboard,  label: 'Home'       },
  { id: 'collection', Icon: IconCollection, label: 'Collection' },
  { id: 'series',     Icon: IconSeries,     label: 'Series'     },
  { id: 'add',        Icon: IconAdd,        label: 'Add'        },
  { id: 'releases',   Icon: IconReleases,   label: 'Releases'   },
]

export default function MobileNav({ page, setPage }) {
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`mobile-nav-item ${page === item.id ? 'active' : ''}`}
          onClick={() => setPage(item.id)}
        >
          {item.id === 'add' ? (
            <div className="mobile-nav-add">
              <IconAdd size={20} strokeWidth={2.5} color="#fff" />
            </div>
          ) : (
            <>
              <item.Icon size={20} strokeWidth={1.75} />
              <span className="mobile-nav-label">{item.label}</span>
            </>
          )}
        </button>
      ))}
    </nav>
  )
}
