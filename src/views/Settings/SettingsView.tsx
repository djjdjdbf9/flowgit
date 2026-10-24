import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/ui.store'
import TitleBar from '../../components/TitleBar'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Spinner from '../../components/Spinner'
import type { AppSettings } from '@shared/types/ipc.types'

export const SettingsView: React.FC = () => {
  const navigate = useNavigate()
  const { showToast } = useUiStore()

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    window.flowgit.settings
      .get()
      .then((data) => {
        setSettings(data)
      })
      .catch((e: unknown) => {
        showToast({
          type: 'error',
          title: 'Failed to load settings',
          message: e instanceof Error ? e.message : String(e),
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [showToast])

  const handleUpdate = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
    try {
      await window.flowgit.settings.set(key, value)
      showToast({ type: 'success', title: 'Setting saved' })
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error updating setting',
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#000000',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <TitleBar showRepoSwitcher={false} />

      {/* Header bar */}
      <div
        style={{
          padding: '16px 32px',
          background: '#141414',
          borderBottom: '1px solid #202020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#da5c2c',
              fontSize: '14px',
              fontFamily: 'var(--font-mono, monospace)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ← Back
          </button>
          <span style={{ color: '#3a3a3a' }}>/</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#eeeeee' }}>SETTINGS</span>
        </div>

        {loading && <Spinner size="sm" />}
      </div>

      {/* Settings Form Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {settings ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Git binary configuration */}
            <div style={sectionBoxStyle}>
              <div style={sectionTitleStyle}>Git Binary Path</div>
              <div style={sectionDescStyle}>
                Leave blank to automatically detect git from your system PATH.
              </div>
              <Input
                placeholder="Auto-detect (system PATH)"
                value={settings.gitPath ?? ''}
                onChange={(e) => handleUpdate('gitPath', e.target.value.trim() || null)}
              />
            </div>

            {/* General Preferences */}
            <div style={sectionBoxStyle}>
              <div style={sectionTitleStyle}>Behavior & Safety</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={settings.confirmDestructive}
                    onChange={(e) => handleUpdate('confirmDestructive', e.target.checked)}
                    style={{ accentColor: '#da5c2c' }}
                  />
                  <span>Confirm before destructive operations (discard, delete branch, drop stash)</span>
                </label>

                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={settings.autoFetch}
                    onChange={(e) => handleUpdate('autoFetch', e.target.checked)}
                    style={{ accentColor: '#da5c2c' }}
                  />
                  <span>Automatically fetch from remotes in background</span>
                </label>

                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={settings.showHiddenFiles}
                    onChange={(e) => handleUpdate('showHiddenFiles', e.target.checked)}
                    style={{ accentColor: '#da5c2c' }}
                  />
                  <span>Show hidden dotfiles (.gitignore, .env, etc.)</span>
                </label>
              </div>
            </div>

            {/* Pull Strategy */}
            <div style={sectionBoxStyle}>
              <div style={sectionTitleStyle}>Default Pull Strategy</div>
              <div style={sectionDescStyle}>
                How FlowGit integrates remote branch updates when pulling.
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                {(['merge', 'rebase', 'ff-only'] as const).map((strat) => (
                  <label key={strat} style={{ ...checkboxLabelStyle, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="pullStrategy"
                      checked={settings.pullStrategy === strat}
                      onChange={() => handleUpdate('pullStrategy', strat)}
                      style={{ accentColor: '#da5c2c' }}
                    />
                    <span style={{ textTransform: 'uppercase', fontSize: '12px' }}>{strat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Theme & Aesthetics */}
            <div style={sectionBoxStyle}>
              <div style={sectionTitleStyle}>Appearance</div>
              <div style={sectionDescStyle}>
                FlowGit uses Axiom Dark Design Language exclusively. Monospaced typography with BerkeleyMono.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                <div
                  style={{
                    background: '#111111',
                    border: '1px solid #da5c2c',
                    borderRadius: '2px',
                    padding: '8px 16px',
                    color: '#eeeeee',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#da5c2c' }}>●</span>
                  <span>Void Dark (#000000)</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #202020',
  borderRadius: '2px',
  padding: '20px',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#eeeeee',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.02em',
}

const sectionDescStyle: React.CSSProperties = {
  color: '#7e7e7e',
  fontSize: '12px',
  marginTop: '4px',
  marginBottom: '12px',
  lineHeight: 1.5,
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '13px',
  color: '#b4b4b4',
  cursor: 'pointer',
}

export default SettingsView
