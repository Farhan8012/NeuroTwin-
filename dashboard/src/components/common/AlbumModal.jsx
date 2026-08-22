import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select } from './UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function AlbumModal({ isOpen, onClose, album = null, onSave }) {
  const { showToast } = useAppState()
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Family',
    description: '',
    year: new Date().getFullYear().toString(),
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    photos: []
  })

  useEffect(() => {
    if (album) {
      setFormData(album)
    } else {
      setFormData({
        title: '',
        category: 'Family',
        description: '',
        year: new Date().getFullYear().toString(),
        isFeatured: false,
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
        photos: []
      })
    }
  }, [album, isOpen])

  if (!isOpen) return null

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const newPhotos = files.map(file => ({
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: URL.createObjectURL(file),
        caption: file.name
      }))
      
      setFormData(prev => ({
        ...prev,
        image: prev.photos.length === 0 ? newPhotos[0].url : prev.image, // Set first photo as cover if no cover exists
        photos: [...prev.photos, ...newPhotos]
      }))
      showToast(`Added ${files.length} photo(s)`, 'success')
    }
  }

  const handleRemovePhoto = (idToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== idToRemove)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title) {
      showToast('Album Title is required.', 'error')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-outline-variant/40 dark:border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {album ? 'Edit Memory Album' : 'Create New Album'}
          </h2>
          <button onClick={onClose} type="button" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Album Title *"
              placeholder="e.g. 1980 Family Vacation" 
              value={formData.title} 
              onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))} 
            />
            <Select 
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
              options={[
                { value: 'Family', label: 'Family' },
                { value: 'Travel', label: 'Travel' },
                { value: 'Music', label: 'Music' },
                { value: 'Milestones', label: 'Milestones' },
                { value: 'Recipes', label: 'Recipes' }
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Description / Story
            </label>
            <textarea 
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
              placeholder="Share the story behind this album..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Feature this Memory?</p>
              <p className="text-xs text-slate-500">Featured memories appear on the patient's home dashboard.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({...prev, isFeatured: e.target.checked}))}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Album Photos ({formData.photos.length})
              </label>
              <div>
                <input 
                  type="file" 
                  id="album-photos" 
                  accept="image/*" 
                  multiple
                  className="hidden"
                  onChange={handlePhotosChange}
                />
                <Button size="sm" variant="outline" type="button" onClick={() => document.getElementById('album-photos').click()}>
                  Upload Photos
                </Button>
              </div>
            </div>

            {formData.photos.length === 0 ? (
              <div className="py-8 text-center bg-surface-container-low dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">add_photo_alternate</span>
                <p className="text-xs text-slate-500">No photos added yet. Click upload to add photos to this album.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
                {formData.photos.map(photo => (
                  <div key={photo.id} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square">
                    <img src={photo.url} alt="album photo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    {formData.image === photo.url && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary/80 backdrop-blur-sm text-white text-[10px] font-bold text-center py-1">
                        Cover Image
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {album ? 'Save Changes' : 'Create Album'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
