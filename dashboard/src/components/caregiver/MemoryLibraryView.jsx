import React, { useState } from 'react'
import { Card, Badge, Button, Input } from '../common/UIPrimitives'
import { MemoryCard } from '../common/MemoryCard'
import { useAppState } from '../../context/AppStateContext'
import { AlbumModal } from '../common/AlbumModal'

export function MemoryLibraryView() {
  const { setAddMemoryOpen, activePatient, memoryAlbums, showToast, saveMemoryAlbum, deleteMemoryAlbum } = useAppState()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [query, setQuery] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)

  const handleSaveAlbum = async (albumData) => {
    try {
      await saveMemoryAlbum(editingAlbum ? { ...albumData, id: editingAlbum.id } : albumData)
      showToast(editingAlbum ? 'Album updated successfully' : 'Album created successfully', 'success')
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error')
    }
    setModalOpen(false)
    setEditingAlbum(null)
  }

  const handleDeleteAlbum = async (id) => {
    if (window.confirm('Are you sure you want to delete this album?')) {
      await deleteMemoryAlbum(id)
      showToast('Album deleted', 'info')
    }
  }

  const filteredMemories = memoryAlbums.filter(
    (m) =>
      (selectedCategory === 'All' || m.category === selectedCategory) &&
      (m.title.toLowerCase().includes(query.toLowerCase()) || m.description.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Memory Library</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Indexed AI memories, family photo archives, and voice prompts for <strong>{activePatient.name}</strong> ({memoryAlbums.length} albums)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setEditingAlbum(null); setModalOpen(true); }}>
          ➕ Add New Memory Album
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="w-full md:w-72">
          <Input placeholder="Search memory titles, dates, or tags..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Family', 'Travel', 'Music', 'Milestones', 'Recipes'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-[#2B6CB0] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid or Empty State */}
      {memoryAlbums.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">photo_library</span>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Memories Yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Create an album to start preserving memories and photos for your loved one.
          </p>
          <Button variant="primary" className="mt-6 mx-auto block" onClick={() => { setEditingAlbum(null); setModalOpen(true); }}>
            Create First Album
          </Button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-slate-500">No memory albums found for your search/filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => (
            <div key={mem.id} className="relative group">
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingAlbum(mem); setModalOpen(true); }}
                  className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-primary hover:text-white rounded-full text-slate-700 dark:text-slate-300 shadow-md backdrop-blur-sm transition"
                  title="Edit Album"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button 
                  onClick={() => handleDeleteAlbum(mem.id)}
                  className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-rose-500 hover:text-white rounded-full text-slate-700 dark:text-slate-300 shadow-md backdrop-blur-sm transition"
                  title="Delete Album"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <MemoryCard memory={mem} />
            </div>
          ))}
        </div>
      )}

      <AlbumModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAlbum(null); }}
        album={editingAlbum}
        onSave={handleSaveAlbum}
      />
    </div>
  )
}
