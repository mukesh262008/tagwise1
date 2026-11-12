import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, ErrorBox, Field, Input, Modal, Select, Textarea } from '../ui'

export default function PartForm({ part, onSaved, onDeleted, onClose }) {
  const { isAdmin } = useAuth()
  const editing = !!part
  const [f, setF] = useState({
    part_number: part?.part_number ?? '',
    name: part?.name ?? '',
    category: part?.category ?? '',
    condition: part?.condition ?? 'good',
    quantity: part?.quantity ?? 1,
    price: part?.price ?? '',
    location_note: part?.location_note ?? '',
    notes: part?.notes ?? '',
  })
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api('/parts/categories').then(setCategories).catch(() => {})
  }, [])

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const json = {
      ...f,
      quantity: Number(f.quantity),
      price: f.price === '' ? null : Number(f.price),
    }
    try {
      const saved = editing
        ? await api(`/parts/${part.id}`, { method: 'PATCH', json })
        : await api('/parts', { method: 'POST', json })
      onSaved(saved)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${part.part_number}? This also removes its fitments and links.`)) return
    setDeleting(true)
    setError('')
    try {
      await api(`/parts/${part.id}`, { method: 'DELETE' })
      onDeleted()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit part' : 'Add part'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Part number" hint="Dashes and spaces are ignored when matching">
            <Input value={f.part_number} onChange={set('part_number')} required autoFocus />
          </Field>
          <Field label="Name">
            <Input value={f.name} onChange={set('name')} required />
          </Field>
          <Field label="Category">
            <Input list="part-categories" value={f.category} onChange={set('category')} placeholder="e.g. Electrical" />
            <datalist id="part-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Condition">
            <Select value={f.condition} onChange={set('condition')}>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </Field>
          <Field label="Quantity in stock">
            <Input type="number" min="0" value={f.quantity} onChange={set('quantity')} required />
          </Field>
          <Field label="Price" hint="Optional">
            <Input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} />
          </Field>
        </div>
        <Field label="Where is it?" hint="Free text for now, e.g. “Shelf B3” or “Heap 2, north corner”">
          <Input value={f.location_note} onChange={set('location_note')} />
        </Field>
        <Field label="Notes">
          <Textarea rows={3} value={f.notes} onChange={set('notes')} />
        </Field>
        <div className="flex justify-between gap-2">
          {editing && isAdmin && (
            <Button variant="danger" onClick={remove} disabled={busy || deleting}>
              {deleting ? 'Deleting…' : 'Delete part'}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy || deleting}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || deleting}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
