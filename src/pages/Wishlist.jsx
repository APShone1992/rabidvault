import { useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { useFriends }  from '../hooks/useFriends'
import { useToast }    from '../context/ToastContext'
import { IconAdd }     from '../lib/icons'

const PRIORITY_COLOR = {
  High:   { bg: 'rgba(239,68,68,0.15)',    text: '#fca5a5' },
  Medium: { bg: 'rgba(245,158,11,0.15)',   text: '#fcd34d' },
  Low:    { bg: 'rgba(16,185,129,0.15)',   text: '#6ee7b7' },
}

export default function Wishlist() {
  const { wishlist, loading, addItem, removeItem, toggleAlert } = useWishlist()
  const { friendOwns } = useFriends()
  const toast = useToast()

  const [showAdd,        setShowAdd]        = useState(false)
  const [form,           setForm]           = useState({
    title: '', issue_number: '', publisher: '',
    target_price: '', priority: 'Medium', notes: '', alert_enabled: false,
  })
  const [saving,         setSaving]         = useState(false)
  const [filterPriority, setFilterPriority] = useState('All')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Please enter a title'); return }
    setSaving(true)
    try {
      await addItem({ ...form, target_price: parseFloat(form.target_price) || 0 })
      toast.success('Added to wishlist!')
      setForm({ title: '', issue_number: '', publisher: '', target_price: '', priority: 'Medium', notes: '', alert_enabled: false })
      setShowAdd(false)
    } catch (_) {
      toast.error('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  const filtered = wishlist.filter(w => filterPriority === 'All' || w.priority === filterPriority)

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Wishlist</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} className={`tab ${filterPriority === p ? 'active' : ''}`}
                onClick={() => setFilterPriority(p)}>{p}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
