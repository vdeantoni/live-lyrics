import { useAtomValue, useSetAtom } from 'jotai'
import {
  availableSources,
  currentSourceConfigAtom,
  switchSourceAtom
} from '@/atoms/sourceAtoms'
import { Switch } from '@/components/ui/switch'

const SourceSwitcher = () => {
  const currentConfig = useAtomValue(currentSourceConfigAtom)
  const switchSource = useSetAtom(switchSourceAtom)

  const isServerMode = currentConfig.type === 'http'

  const handleToggle = (checked: boolean) => {
    // checked = true means Server mode (http)
    // checked = false means Player mode (simulated) - default
    const targetSource = availableSources.find(source =>
      checked ? source.type === 'http' : source.type === 'simulated'
    )
    if (targetSource) {
      switchSource(targetSource)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <Switch
        id="server-mode"
        checked={isServerMode}
        onCheckedChange={handleToggle}
      />
      <label htmlFor="server-mode" className="text-sm font-medium text-zinc-300 cursor-pointer">
        Server Mode
      </label>
    </div>
  )
}

export default SourceSwitcher