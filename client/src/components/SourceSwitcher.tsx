import { useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import {
  availableSources,
  currentSourceConfigAtom,
  switchSourceAtom
} from '@/atoms/sourceAtoms'
import { Wifi, WifiOff, Cpu } from 'lucide-react'

const SourceSwitcher = () => {
  const currentConfig = useAtomValue(currentSourceConfigAtom)
  const switchSource = useSetAtom(switchSourceAtom)

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'http':
        return <Wifi className="w-4 h-4" />
      case 'simulated':
        return <Cpu className="w-4 h-4" />
      default:
        return <WifiOff className="w-4 h-4" />
    }
  }

  return (
    <div className="flex gap-2">
      {availableSources.map((source) => (
        <Button
          key={source.type}
          size="sm"
          variant={currentConfig.type === source.type ? "default" : "outline"}
          onClick={() => switchSource(source)}
          className="flex items-center gap-2"
        >
          {getSourceIcon(source.type)}
          {source.name}
        </Button>
      ))}
    </div>
  )
}

export default SourceSwitcher