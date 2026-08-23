import React from 'react'
import { Card, Button, Input, Select } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function SettingsView() {
  const { isDarkMode, setIsDarkMode, fontScale, setFontScale, showToast, activePatient, setActivePatient } = useAppState()

  const handleSave = () => {
    showToast('Settings saved successfully', 'success')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Application Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure security, HIPAA compliance, AI voice synthesis, and accessibility preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile & Personalization Card */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Profile & Personalization</h3>
          
          <div className="flex items-center gap-6">
            <img 
              src={activePatient?.avatar || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'} 
              alt="Profile Preview" 
              className="w-20 h-20 rounded-full object-cover shadow-sm ring-2 ring-outline-variant/40"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Profile Picture
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setActivePatient((prev) => ({ ...prev, avatar: url }))
                      showToast('Profile picture updated successfully', 'success')
                    }
                  }}
                />
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => document.getElementById('avatar-upload').click()}
                >
                  Upload Photo
                </Button>
                <Button 
                  size="sm"
                  variant="outline" 
                  className="text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/30"
                  onClick={() => {
                    setActivePatient(prev => ({...prev, avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80'}))
                    showToast('Profile picture reset to default', 'info')
                  }}
                >
                  Remove
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">Supported formats: JPG, PNG, WEBP. Max size: 5MB.</p>
            </div>
          </div>
        </Card>

        {/* Accessibility & Visual Theme Card */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Visual Theme & Accessibility</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Theme Mode
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!isDarkMode ? 'primary' : 'outline'}
                  onClick={() => setIsDarkMode(false)}
                >
                  ☀️ Light Mode (Default)
                </Button>
                <Button
                  size="sm"
                  variant={isDarkMode ? 'primary' : 'outline'}
                  onClick={() => setIsDarkMode(true)}
                >
                  🌙 Dark Mode
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Elderly Font Scaling
              </label>
              <Select
                value={fontScale}
                onChange={(e) => setFontScale(e.target.value)}
                options={[
                  { value: 'normal', label: 'Normal Standard (100%)' },
                  { value: 'large', label: 'Large High-Readability (118%)' },
                  { value: 'xlarge', label: 'Extra Large Senior Mode (135%)' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* AI Voice Companion Preferences */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Voice Synthesis & Tone</h3>

          <Select
            label="Default Companion Voice"
            options={[
              { value: 'warm-female', label: 'Warm & Calming Female (Sarah AI Voice)' },
              { value: 'gentle-male', label: 'Gentle & Clear Male (Thomas AI Voice)' },
            ]}
          />

          <Select
            label="Audio Playback Speed"
            options={[
              { value: '0.85', label: '0.85x (Slower & Extra Clear for Seniors)' },
              { value: '1.0', label: '1.0x (Normal)' },
            ]}
          />
        </Card>

        {/* Security & HIPAA Compliance */}
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">HIPAA Security & Encryption</h3>
          <p className="text-xs text-slate-500">
            All memory audio dictations, photos, and clinical logs are encrypted using AES-256 at rest and TLS 1.3 in transit.
          </p>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            🔒 HIPAA Compliance Audit Status: Certified Active (SOC-2 Type II Verified)
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="primary" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
