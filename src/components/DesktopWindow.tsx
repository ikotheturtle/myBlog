"use client"

import { useState, useRef, useEffect } from "react"
import { X, Minus, Maximize2 } from "lucide-react"

interface DesktopWindowProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onFocus: () => void
  children: React.ReactNode
  id: string
  zIndex: number
  initialPos?: { x: number; y: number }
}

export default function DesktopWindow({
  title,
  isOpen,
  onClose,
  onFocus,
  children,
  id,
  zIndex,
  initialPos = { x: 50, y: 50 }
}: DesktopWindowProps) {
  const [pos, setPos] = useState(initialPos)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Refs for smooth dragging without React re-renders
  const windowRef = useRef<HTMLDivElement>(null)
  const relRef = useRef({ x: 0, y: 0 })
  const posRef = useRef(initialPos)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isDragging || isMobile) return

    const onMouseMove = (e: MouseEvent) => {
      const newX = e.pageX - relRef.current.x
      const newY = e.pageY - relRef.current.y
      
      posRef.current = { x: newX, y: newY }
      
      // Update DOM synchronously without requestAnimationFrame
      // This eliminates the 1-frame delay (16ms at 60Hz) making it stick to the cursor instantly
      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`
        windowRef.current.style.top = `${newY}px`
      }
    }

    const onMouseUp = () => {
      setIsDragging(false)
      setPos(posRef.current) // Sync final position to React state
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [isDragging])

  if (!isOpen) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isMobile) return // Only left click and not mobile
    onFocus()

    setIsDragging(true)
    // Calculate the difference between the mouse cursor and the current window position
    relRef.current = {
      x: e.pageX - posRef.current.x,
      y: e.pageY - posRef.current.y
    }
  }

  return (
    <div
      ref={windowRef}
      className={`fixed lg:absolute inset-2 top-14 bottom-20 lg:inset-auto lg:w-[60%] lg:min-h-[400px] lg:h-[68%] bg-bg-dark/95 lg:bg-bg-dark/50 backdrop-blur-md border border-bg-medium rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 ${isDragging ? "select-none transition-none" : "duration-200"}`}
      style={isMobile ? { zIndex } : {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: zIndex
      }}
      id={`window-${id}`}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        className="h-9 bg-bg-dark-hard/10 border-b border-bg-medium rounded-t-lg flex items-center justify-between px-4 select-none"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red/40" />
            <div className="w-3 h-3 rounded-full bg-yellow/40" />
            <div className="w-3 h-3 rounded-full bg-green/40" />
          </div>
          <span className="text-xs font-mono text-fg-dim ml-2">{title}</span>
        </div>

        <div 
          className="flex items-center gap-3 text-gray"
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking controls
        >
          <Minus size={14} className="hover:text-fg cursor-pointer" />
          <Maximize2 size={14} className="hover:text-fg cursor-pointer" />
          <X
            size={16}
            className="hover:text-red transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-bg-medium scrollbar-track-transparent cursor-move">
        {children}
      </div>
    </div>
  )
}

