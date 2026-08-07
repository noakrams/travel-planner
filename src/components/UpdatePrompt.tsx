import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  return needRefresh ? <div className="update-prompt" role="status"><span>A fresh version is ready.</span><button onClick={() => updateServiceWorker(true)}>Update now</button><button onClick={() => setNeedRefresh(false)}>Later</button></div> : null
}
