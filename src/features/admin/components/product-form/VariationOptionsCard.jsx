import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  isColorAttributeKey,
  normalizeHexColor,
  suggestHexForColorName,
  UNKNOWN_SWATCH_HEX,
} from '@/features/product/colorSwatch'
import {
  MAX_VARIATION_AXES,
  PRESET_OPTION_KEYS,
  buildCombinations,
  getEnabledAxisKeys,
  normalizeKey,
  planCombinationApply,
  uniqueOptionValues,
} from './variationCombinations'

export default function VariationOptionsCard({
  options = [],
  onChange,
  formData,
  isEdit = false,
  disabled = false,
  applying = false,
  onApply,
}) {
  const [draftValueByOption, setDraftValueByOption] = useState({})
  const [customKey, setCustomKey] = useState('')
  const [checked, setChecked] = useState(null)

  const built = useMemo(() => buildCombinations(options), [options])
  const axisKeys = useMemo(() => getEnabledAxisKeys(options), [options])
  const enabledCount = (options || []).filter((o) => o.enabled !== false && String(o.key || '').trim()).length

  const signaturesKey = (built.combinations || []).map((c) => c.signature).join(',')
  useEffect(() => {
    setChecked(new Set((built.combinations || []).map((c) => c.signature)))
  }, [signaturesKey])

  const selectedSignatures = useMemo(
    () => (checked ? [...checked] : (built.combinations || []).map((c) => c.signature)),
    [checked, built.combinations]
  )

  const plan = useMemo(
    () =>
      planCombinationApply({
        formData,
        isEdit,
        options,
        selectedSignatures,
      }),
    [formData, isEdit, options, selectedSignatures]
  )

  const commitOptions = (next) => {
    if (typeof onChange === 'function') onChange(next)
  }

  const togglePreset = (key) => {
    if (disabled || applying) return
    const nk = normalizeKey(key)
    const existing = (options || []).find((o) => normalizeKey(o.key) === nk)
    if (existing) {
      commitOptions(
        options.map((o) => (normalizeKey(o.key) === nk ? { ...o, enabled: !o.enabled } : o))
      )
      return
    }
    if (enabledCount >= MAX_VARIATION_AXES) {
      toast.error(`A product can vary by at most ${MAX_VARIATION_AXES} options.`)
      return
    }
    commitOptions([
      ...(options || []),
      { id: `opt-${nk}-${Date.now()}`, key, enabled: true, values: [] },
    ])
  }

  const addCustomOption = () => {
    const key = customKey.trim()
    if (!key) return
    if (disabled || applying) return
    const nk = normalizeKey(key)
    if ((options || []).some((o) => normalizeKey(o.key) === nk)) {
      toast.error(`“${key}” is already an option.`)
      return
    }
    if (enabledCount >= MAX_VARIATION_AXES) {
      toast.error(`A product can vary by at most ${MAX_VARIATION_AXES} options.`)
      return
    }
    commitOptions([
      ...(options || []),
      { id: `opt-${nk}-${Date.now()}`, key, enabled: true, values: [] },
    ])
    setCustomKey('')
  }

  const addValue = (option) => {
    const raw = String(draftValueByOption[option.id] || '').trim()
    if (!raw) return
    const nextValues = uniqueOptionValues([
      ...(option.values || []),
      {
        key: option.key,
        value: raw,
        hex: isColorAttributeKey(option.key) ? (suggestHexForColorName(raw) || '') : '',
      },
    ])
    if (nextValues.length === (option.values || []).length) {
      toast.message(`“${raw}” is already listed.`)
    }
    commitOptions(
      options.map((o) => (o.id === option.id ? { ...o, values: nextValues, enabled: true } : o))
    )
    setDraftValueByOption((prev) => ({ ...prev, [option.id]: '' }))
  }

  const removeValue = (option, valueId) => {
    commitOptions(
      options.map((o) =>
        o.id === option.id
          ? { ...o, values: (o.values || []).filter((v) => v.id !== valueId) }
          : o
      )
    )
  }

  const updateValueHex = (option, valueId, hex) => {
    commitOptions(
      options.map((o) =>
        o.id === option.id
          ? {
              ...o,
              values: (o.values || []).map((v) =>
                v.id === valueId ? { ...v, hex: normalizeHexColor(hex) || hex } : v
              ),
            }
          : o
      )
    )
  }

  const toggleCombo = (signature) => {
    setChecked((prev) => {
      const next = new Set(prev || [])
      if (next.has(signature)) next.delete(signature)
      else next.add(signature)
      return next
    })
  }

  const handleApply = () => {
    if (disabled || applying) return
    if (!built.ok) {
      toast.error(built.error || 'Cannot generate these combinations.')
      return
    }
    if (!selectedSignatures.length) {
      toast.error('Select at least one combination.')
      return
    }
    onApply?.(selectedSignatures)
  }

  const summary = plan?.summary || { keep: 0, update: 0, create: 0, leftover: 0 }
  const generateDisabled =
    disabled ||
    applying ||
    !built.ok ||
    !selectedSignatures.length ||
    (summary.keep > 0 && summary.update === 0 && summary.create === 0)

  return (
    <div className="pf-card w-full">
      <div className="pf-card__head">
        <div>
          <h3>Variations</h3>
          <p>
            Choose how this product varies (Color, Size, or a custom field). Each combination becomes its own SKU — same Color in different sizes will not look like duplicates.
          </p>
        </div>
      </div>
      <div className="pf-card__body pf-variation-body">
        <div className="pf-variation-presets" role="group" aria-label="Variation options">
          {PRESET_OPTION_KEYS.map((key) => {
            const current = (options || []).find((o) => normalizeKey(o.key) === normalizeKey(key))
            const on = Boolean(current?.enabled)
            return (
              <button
                key={key}
                type="button"
                className={`pf-variation-preset${on ? ' is-on' : ''}`}
                aria-pressed={on}
                disabled={disabled || applying}
                onClick={() => togglePreset(key)}
              >
                {key}
              </button>
            )
          })}
        </div>

        <div className="pf-variation-add-row">
          <input
            type="text"
            value={customKey}
            disabled={disabled || applying}
            onChange={(e) => setCustomKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomOption()
              }
            }}
            className="pf-input"
            placeholder="Add option (e.g. Material, Length)"
            maxLength={40}
          />
          <button
            type="button"
            className="pf-chip-btn pf-chip-btn--secondary"
            disabled={disabled || applying || !customKey.trim()}
            onClick={addCustomOption}
          >
            + Add option
          </button>
        </div>

        {(options || [])
          .filter((opt) => opt.enabled !== false && String(opt.key || '').trim())
          .map((opt) => {
            const isColor = isColorAttributeKey(opt.key)
            return (
              <div key={opt.id} className="pf-variation-axis">
                <div className="pf-variation-axis__head">
                  <span className="pf-variation-axis__name">{opt.key}</span>
                  <span className="pf-variation-axis__count">
                    {(opt.values || []).length} value{(opt.values || []).length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="pf-variation-values">
                  {(opt.values || []).map((val) => {
                    const pickerHex = normalizeHexColor(val.hex) || suggestHexForColorName(val.value) || UNKNOWN_SWATCH_HEX
                    return (
                      <span key={val.id} className="pf-variation-chip">
                        {isColor ? (
                          <label
                            className="pf-variation-chip__swatch"
                            title="Swatch color"
                            style={{ background: pickerHex }}
                          >
                            <input
                              type="color"
                              value={pickerHex}
                              disabled={disabled || applying}
                              onChange={(e) => updateValueHex(opt, val.id, e.target.value)}
                            />
                          </label>
                        ) : null}
                        <span>{val.value}</span>
                        <button
                          type="button"
                          className="pf-variation-chip__remove"
                          aria-label={`Remove ${val.value}`}
                          disabled={disabled || applying}
                          onClick={() => removeValue(opt, val.id)}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
                <div className="pf-variation-add-row">
                  <input
                    type="text"
                    value={draftValueByOption[opt.id] || ''}
                    disabled={disabled || applying}
                    onChange={(e) =>
                      setDraftValueByOption((prev) => ({ ...prev, [opt.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addValue(opt)
                      }
                    }}
                    className="pf-input"
                    placeholder={isColor ? 'Add color (e.g. Red)' : `Add ${opt.key.toLowerCase()} value`}
                  />
                  <button
                    type="button"
                    className="pf-chip-btn pf-chip-btn--secondary"
                    disabled={disabled || applying || !String(draftValueByOption[opt.id] || '').trim()}
                    onClick={() => addValue(opt)}
                  >
                    Add
                  </button>
                </div>
              </div>
            )
          })}

        {!built.ok ? (
          <p className="pf-main__warn">{built.error}</p>
        ) : built.combinations.length > 0 ? (
          <div className="pf-variation-preview">
            <div className="pf-variation-preview__head">
              <p>
                {built.combinations.length} combination{built.combinations.length === 1 ? '' : 's'}
                {axisKeys.length ? ` · ${axisKeys.join(' × ')}` : ''}
              </p>
              <button
                type="button"
                className="pf-variation-preview__all"
                disabled={disabled || applying}
                onClick={() => {
                  const allOn = selectedSignatures.length === built.combinations.length
                  setChecked(allOn ? new Set() : new Set(built.combinations.map((c) => c.signature)))
                }}
              >
                {selectedSignatures.length === built.combinations.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="pf-variation-combos">
              {built.combinations.map((combo) => (
                <label key={combo.signature} className="pf-variation-combo">
                  <input
                    type="checkbox"
                    checked={selectedSignatures.includes(combo.signature)}
                    disabled={disabled || applying}
                    onChange={() => toggleCombo(combo.signature)}
                  />
                  <span>{combo.label}</span>
                </label>
              ))}
            </div>
            <p className="pf-variation-summary">
              {summary.create} new SKU{summary.create === 1 ? '' : 's'}
              {summary.update ? ` · ${summary.update} existing will get missing options` : ''}
              {summary.keep ? ` · ${summary.keep} already match` : ''}
              {summary.leftover ? ` · ${summary.leftover} existing left unchanged` : ''}
            </p>
          </div>
        ) : (
          <p className="pf-variation-empty">
            Add values for the selected options, then generate SKUs. Color-only products can stay as they are — do not generate unless you need Size or another option.
          </p>
        )}

        <div className="pf-variation-actions">
          <button
            type="button"
            className="pf-chip-btn pf-chip-btn--indigo"
            disabled={generateDisabled}
            onClick={handleApply}
          >
            {applying ? 'Applying…' : 'Generate variants'}
          </button>
        </div>
      </div>
    </div>
  )
}
