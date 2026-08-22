import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import {
  useAdminShippingSettings,
  useTestAdminShippingConnection,
  useUpdateAdminShippingSettings,
} from '@/features/admin/hooks'
import { AdminPageHeader } from '@/features/admin/components/AdminUi'

export default function AdminDeliverySettingsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminShippingSettings()
  const updateSettings = useUpdateAdminShippingSettings()
  const testConnection = useTestAdminShippingConnection()

  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!data) return
    setProvider(data.provider || data.shippingProvider || 'shipmozo')
    setEnabled(Boolean(data.enabled ?? data.isEnabled))
    if (data.apiKeyHint) setApiKey('')
  }, [data])

  const handleSave = async () => {
    setSaveOk(false)
    const body = {
      provider: provider || 'shipmozo',
      enabled,
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    }
    try {
      await updateSettings.mutateAsync(body)
      setSaveOk(true)
      setApiKey('')
    } catch {
      /* error on mutation */
    }
  }

  const handleTest = async () => {
    try {
      await testConnection.mutateAsync({})
    } catch (err) {
      /* toast optional */
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Settings" title="Delivery & shipping" />

      {isLoading && (
        <div className="admin-empty">
          <Loader2 className="payment-overlay__spinner" size={24} />
          <p>Loading delivery settings…</p>
        </div>
      )}

      {isError && (
        <div className="admin-empty">
          <p>{error?.message || 'Could not load delivery settings'}</p>
          <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="admin-card">
          <div className="admin-form-stack">
            <label className="admin-toggle">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span>Shipping provider enabled</span>
            </label>

            <InputGroup label="Provider" htmlFor="provider">
              <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
            </InputGroup>

            <InputGroup label="API key" htmlFor="apiKey">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={data?.apiKeyHint ? 'Leave blank to keep current key' : 'Enter API key'}
              />
            </InputGroup>

            {updateSettings.isError && (
              <p className="admin-form-error">{updateSettings.error?.message || 'Save failed'}</p>
            )}
            {testConnection.isSuccess && (
              <p className="admin-form-success">Connection test succeeded.</p>
            )}
            {testConnection.isError && (
              <p className="admin-form-error">{testConnection.error?.message || 'Connection test failed'}</p>
            )}
            {saveOk && <p className="admin-form-success">Settings saved.</p>}

            <div className="admin-row-actions">
              <Button variant="primary" onClick={handleSave} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving…' : 'Save settings'}
              </Button>
              <Button variant="secondary" onClick={handleTest} disabled={testConnection.isPending}>
                {testConnection.isPending ? 'Testing…' : 'Test connection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
