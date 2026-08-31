/**
 * India Postal Pincode API lookup service
 * GET https://api.postalpincode.in/pincode/{pincode}
 */
export async function fetchPostalPincode(pincode) {
  const cleanPin = String(pincode || '').trim()
  if (!/^\d{6}$/.test(cleanPin)) return null

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
    if (!response.ok) return null

    const data = await response.json()
    if (!Array.isArray(data) || !data[0] || data[0].Status !== 'Success') {
      return null
    }

    const postOffices = data[0].PostOffice || []
    if (!Array.isArray(postOffices) || postOffices.length === 0) return null

    const sample = postOffices[0]
    const district = sample.District || sample.Division || ''
    const state = sample.State || sample.Circle || ''

    // Unique post office / area names
    const areas = Array.from(
      new Set(
        postOffices
          .map((po) => po.Name)
          .filter(Boolean)
          .map((name) => String(name).trim())
      )
    )

    return {
      pincode: cleanPin,
      district,
      state,
      areas,
      count: areas.length,
    }
  } catch (err) {
    console.warn('Failed to fetch postal pincode details:', err)
    return null
  }
}
