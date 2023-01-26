import prettyMilliseconds from 'pretty-ms'
import {useRef} from 'react'
const prettyMetric = require('pretty-metric')

export default function Instruction({ index, instruction, mode }) {
    const text = useRef('')
    const distance = useRef(0)
    const time = useRef(0)

    if (mode.includes('traffic')) {
        text.current = instruction?.maneuver?.instruction
        distance.current = instruction?.distance
        time.current = instruction?.duration_typical * 1000
    } 
    else {
        text.current = instruction?.text
        distance.current = instruction?.distance
        time.current = instruction?.time
    }
    return (
        <div>
            <span className="text-white text-sm">{index + 1}. </span>
            <span className="text-blue-400 text-sm">{text.current}</span>
            <span className="text-xs text-orange-500">
                {prettyMetric(distance.current).humanize()}
            </span>
            <span className="text-xs text-green-400">
                {time.current && prettyMilliseconds(time.current).toString()}
            </span>
        </div>
    )
}
