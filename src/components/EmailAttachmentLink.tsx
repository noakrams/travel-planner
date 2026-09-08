import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { Copy } from '@phosphor-icons/react/Copy'
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple'
import { useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'

function isMobileGmailMessageLink(url: string) {
  if (typeof navigator === 'undefined') return false
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(navigator.userAgent)
  try {
    const parsed = new URL(url)
    return (isIos || isAndroid) && parsed.hostname === 'mail.google.com' && Boolean(parsed.hash)
  } catch {
    return false
  }
}

export function EmailAttachmentLink({
  url,
  label,
  itemTitle
}: {
  url: string
  label: string
  itemTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const mobileGmailLink = isMobileGmailMessageLink(url)
  const ariaLabel = `Open ${label} for ${itemTitle}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  if (!mobileGmailLink) {
    return (
      <a
        className="card-attachment-link"
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        <EnvelopeSimple size={17} aria-hidden="true" />
        <span>{label}</span>
        <ArrowSquareOut size={15} aria-hidden="true" />
      </a>
    )
  }

  return (
    <>
      <button
        className="card-attachment-link"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
      >
        <EnvelopeSimple size={17} aria-hidden="true" />
        <span>{label}</span>
        <ArrowSquareOut size={15} aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="email-link-dialog" aria-label={`Open ${label}`}>
          <DialogHeader>
            <DialogTitle>Open this email</DialogTitle>
            <DialogDescription>
              Gmail’s mobile app cannot open a saved link to one specific message; it opens the
              inbox instead. Copy the link to keep it handy, or try opening it in your browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="email-link-actions">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="min-h-11">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
              <Copy aria-hidden="true" />
              {copied ? 'Link copied' : 'Copy email link'}
            </Button>
            <Button asChild className="min-h-11">
              <a href={url} target="_blank" rel="noreferrer">
                <ArrowSquareOut aria-hidden="true" />
                Open in browser
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
