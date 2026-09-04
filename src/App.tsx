import { useEffect, useState } from 'react'
import { Game } from './components/Game'
import { Landing } from './components/Landing'

/**
 * Hash routing rather than a router dependency: two views, linkable and
 * refresh-safe on any static host without server-side rewrites.
 *
 * Keeping the split here matters — Game calls useCaseFile, which spawns a
 * worker and fetches the ~3MB case file. Visitors who only read the landing
 * page never pay for it.
 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}

export default function App() {
  const route = useHashRoute()
  const playing = route.startsWith('#/play')

  useEffect(() => {
    document.body.classList.toggle('doc-scroll', !playing)
    return () => document.body.classList.remove('doc-scroll')
  }, [playing])

  return playing ? <Game /> : <Landing />
}
