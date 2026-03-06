import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function AnimatedCounter({ value = 0, duration = 0.9, suffix = '', className = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  const currentValueRef = useRef(0)

  useEffect(() => {
    const controls = animate(currentValueRef.current, Number(value) || 0, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        currentValueRef.current = latest
        setDisplayValue(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [duration, value])

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  )
}

export default AnimatedCounter
    