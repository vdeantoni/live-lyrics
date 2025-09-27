import { useSetAtom } from 'jotai'
import { useSong } from '@/lib/api'
import { syncFromServerAtom } from '@/atoms/playerAtoms'
import { useEffect } from 'react'

/**
 * Hook that syncs player state with server data from React Query
 * Only updates atoms when user is not actively interacting with controls
 */
export const useSongSync = () => {
  const { data: songData } = useSong()
  const syncFromServer = useSetAtom(syncFromServerAtom)

  useEffect(() => {
    if (songData) {
      syncFromServer(songData)
    }
  }, [songData, syncFromServer])

  // Return the song data for components that might need it
  return songData
}