import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'
import {
  buildFacebookShareHref,
  buildTelegramShareHref,
  buildWhatsAppShareHref,
  getProductShareText,
  getProductShareUrl,
  openShareWindow,
} from '@/features/product/share'

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.943 4.557a1.25 1.25 0 0 0-1.27-.18L2.86 11.12c-.86.34-.85 1.57.03 1.88l4.52 1.58 1.74 5.35c.26.8 1.28 1.04 1.86.44l2.5-2.57 4.62 3.38c.7.51 1.7.12 1.88-.73l3.2-14.12a1.25 1.25 0 0 0-.27-1.05zM9.67 13.86l7.7-6.84-6.04 8.22-.16 2.18-1.5-3.56z" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

async function copyText(value) {
  const text = String(value || '')
  if (!text) return false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function ProductShareButton({ slug, title }) {
  const url = getProductShareUrl(slug)
  const text = getProductShareText(title || SITE_NAME, url)
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!url) return null

  const close = () => setOpen(false)

  const shareWhatsApp = () => {
    openShareWindow(buildWhatsAppShareHref(text))
    close()
  }
  const shareFacebook = () => {
    openShareWindow(buildFacebookShareHref(url))
    close()
  }
  const shareTelegram = () => {
    openShareWindow(buildTelegramShareHref(url, title || SITE_NAME))
    close()
  }
  const shareInstagram = async () => {
    close()
    const copied = await copyText(url)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: title || SITE_NAME,
          text: title || SITE_NAME,
          url,
        })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }
    openShareWindow('https://www.instagram.com/')
    if (copied) toast.success('Instagram opened — paste the copied link')
    else toast.error('Could not copy link')
  }
  const shareCopy = async () => {
    const ok = await copyText(url)
    if (ok) toast.success('Link copied')
    else toast.error('Could not copy link')
    close()
  }

  return (
    <div className="pdp-share" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        size="md"
        className={`pdp-info__wish pdp-info__share${open ? ' pdp-info__share--open' : ''}`}
        aria-label="Share product"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Share"
        onClick={() => setOpen((v) => !v)}
      >
        <Share2 size={18} />
      </Button>
      {open ? (
        <div className="pdp-share-pill" role="menu" aria-label="Share this product">
          <button type="button" className="pdp-share-pill__btn pdp-share-pill__btn--wa" role="menuitem" aria-label="WhatsApp" onClick={shareWhatsApp}>
            <IconWhatsApp />
          </button>
          <button type="button" className="pdp-share-pill__btn pdp-share-pill__btn--fb" role="menuitem" aria-label="Facebook" onClick={shareFacebook}>
            <IconFacebook />
          </button>
          <button type="button" className="pdp-share-pill__btn pdp-share-pill__btn--ig" role="menuitem" aria-label="Instagram" onClick={() => { void shareInstagram() }}>
            <IconInstagram />
          </button>
          <button type="button" className="pdp-share-pill__btn pdp-share-pill__btn--tg" role="menuitem" aria-label="Telegram" onClick={shareTelegram}>
            <IconTelegram />
          </button>
          <button type="button" className="pdp-share-pill__btn pdp-share-pill__btn--copy" role="menuitem" aria-label="Copy link" onClick={() => { void shareCopy() }}>
            <IconCopy />
          </button>
        </div>
      ) : null}
    </div>
  )
}
