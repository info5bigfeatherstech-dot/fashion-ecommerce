import { useState } from 'react'
import { X } from 'lucide-react'

export function BrandModal({ brands, setBrands, onSelect, onClose }) {
  const [newBrand, setNewBrand] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const name = newBrand.trim()
    if (!name) {
      setError('Brand name cannot be empty')
      return
    }
    if (brands.includes(name)) {
      setError('This brand already exists')
      return
    }
    const updated = [...brands, name].sort()
    setBrands(updated)
    onSelect(name)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Add New Brand</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {error ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : null}
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand name</label>
        <input
          type="text"
          value={newBrand}
          onChange={(e) => {
            setNewBrand(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Apple, Samsung, Nike"
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newBrand.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Add brand
          </button>
        </div>
      </div>
    </div>
  )
}
