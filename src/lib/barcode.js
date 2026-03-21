// barcode.js — Works on iOS Safari AND Android
// iOS: uses Capacitor Camera native plugin -> ZXing decode
// Android/Desktop: uses ZXing browser camera stream
// File upload: works everywhere as fallback

function isNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true
}

export async function startCameraScanner(videoElement, onResult, onError) {
  if (isNative()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.Base64, source: CameraSource.Camera,
      })
      const barcode = await decodeBase64Image(photo.base64String)
      if (barcode) onResult(barcode)
      else onError(new Error('No barcode found. Try better lighting or use file upload.'))
    } catch (err) { onError(err) }
    return
  }

  try {
    const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/browser')
    const reader  = new BrowserMultiFormatReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    const device  = devices.find(d =>
      d.label.toLowerCase().includes('back') ||
      d.label.toLowerCase().includes('rear') ||
      d.label.toLowerCase().includes('environment')
    ) || devices[0]
    if (!device) throw new Error('No camera found')
    await reader.decodeFromVideoDevice(device.deviceId, videoElement, (result, err) => {
      if (result) onResult(result.getText())
      else if (err && !(err instanceof NotFoundException)) onError(err)
    })
    videoElement._zxingReader = reader
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
      onError(new Error('Camera blocked. Please use "Upload Barcode Image" instead.'))
    } else { onError(err) }
  }
}

export function stopScanner(videoElement) {
  if (videoElement?._zxingReader) {
    videoElement._zxingReader.reset()
    videoElement._zxingReader = null
  }
}

export async function scanFromFile(file) {
  const base64 = await fileToBase64AsBase64(file)
  const result = await decodeBase64Image(base64)
  if (!result) throw new Error('No barcode found in image')
  return result
}

async function decodeBase64Image(base64) {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  const img    = new Image()
  img.src      = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
  try { return (await reader.decodeFromImageElement(img)).getText() } catch { return null }
}

function fileToBase64AsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function lookupBarcode(barcode) {
  // 1. Check Supabase barcode_cache first (works offline if cached)
  try {
    const { supabase } = await import('./supabase')

    // Check the dedicated barcode cache table
    const { data: cached } = await supabase
      .from('barcode_cache')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()

    if (cached) {
      return {
        title: cached.title, issue_number: cached.issue_number,
        publisher: cached.publisher, cover_url: cached.cover_url,
        barcode, _fromCache: true,
      }
    }

    // Also check comics table directly by barcode
    const { data: comic } = await supabase
      .from('comics').select('*').eq('barcode', barcode).maybeSingle()
    if (comic) return comic
  } catch (err) { console.warn("[barcode]", err?.message) }

  // 2. Try external APIs if online
  let result = null

  if (barcode.length === 13 && barcode.startsWith('978')) {
    try {
      const res  = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${barcode}&format=json&jscmd=data`)
      const data = await res.json()
      const book = data[`ISBN:${barcode}`]
      if (book) result = { title: book.title, publisher: book.publishers?.[0]?.name || '', cover_url: book.cover?.medium || '', barcode }
    } catch (err) { console.warn("[barcode]", err?.message) }
  }

  if (!result) {
    try {
      const res  = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
      const data = await res.json()
      const item = data.items?.[0]
      if (item) result = { title: item.title, publisher: item.brand || '', cover_url: item.images?.[0] || '', barcode }
    } catch (err) { console.warn("[barcode]", err?.message) }
  }

  // 3. Cache the result in Supabase so future lookups work offline
  if (result) {
    try {
      const { supabase } = await import('./supabase')
      await supabase.from('barcode_cache').upsert({
        barcode,
        title:        result.title        || '',
        issue_number: result.issue_number || '',
        publisher:    result.publisher    || '',
        cover_url:    result.cover_url    || '',
      }, { onConflict: 'barcode' })
    } catch (_) { /* cache write failed - non-critical */ }
  }

  return result || null
}
