/**
 * Browser Geolocation API wrapper — watch / one-shot position with error handling.
 */

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 30_000,
  timeout: 15_000,
}

/**
 * @returns {Promise<{ lat: number, lng: number, accuracy: number|null, speed: number|null, heading: number|null }>}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation non supportée'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          speed: pos.coords.speed ?? null,
          heading: pos.coords.heading ?? null,
        })
      },
      (err) => reject(err),
      { ...DEFAULT_OPTIONS, ...options },
    )
  })
}

/**
 * @param {(pos: { lat: number, lng: number, accuracy: number|null, speed: number|null }) => void} onUpdate
 * @returns {() => void} stop watching
 */
export function watchPosition(onUpdate, onError, options = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.(new Error('Geolocation non supportée'))
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
      })
    },
    (err) => onError?.(err),
    { ...DEFAULT_OPTIONS, ...options },
  )
  return () => navigator.geolocation.clearWatch(id)
}
