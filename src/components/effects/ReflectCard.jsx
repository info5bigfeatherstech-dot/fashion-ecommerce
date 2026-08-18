import { useState } from 'react'

export default function ReflectCard({ className = '', children }) {
  const [position, setPosition] = useState({ x: 50, y: 50 })

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
  }

  const handleLeave = () => {
    setPosition({ x: 50, y: 50 })
  }

  return (
    <div
      className={`reflect-card ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        '--reflect-x': `${position.x}%`,
        '--reflect-y': `${position.y}%`,
      }}
    >
      <div className="reflect-card__glow" aria-hidden="true" />
      <div className="reflect-card__shine" aria-hidden="true" />
      {children}
    </div>
  )
}

