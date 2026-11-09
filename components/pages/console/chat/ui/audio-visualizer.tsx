"use client"

import { useEffect, useRef } from "react"

// Configuration constants for the audio analyzer
const AUDIO_CONFIG = {
  FFT_SIZE: 512,
  SMOOTHING: 0.8,
  MIN_BAR_HEIGHT: 2,
  MIN_BAR_WIDTH: 2,
  BAR_SPACING: 1,
  COLOR: {
    MIN_INTENSITY: 100, // Minimum gray value (darker)
    MAX_INTENSITY: 255, // Maximum gray value (brighter)
    INTENSITY_RANGE: 155, // MAX_INTENSITY - MIN_INTENSITY
  },
} as const

// Calculate the color intensity based on bar height
function getBarColor(normalizedHeight: number) {
  const intensity =
    Math.floor(normalizedHeight * AUDIO_CONFIG.COLOR.INTENSITY_RANGE) +
    AUDIO_CONFIG.COLOR.MIN_INTENSITY
  return `rgb(${intensity}, ${intensity}, ${intensity})`
}

// Draw a single bar of the visualizer, mirrored above and below the center
function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  centerY: number,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color
  ctx.fillRect(x, centerY - height, width, height)
  ctx.fillRect(x, centerY, width, height)
}

interface AudioVisualizerProps {
  stream: MediaStream | null
  isRecording: boolean
  onClick: () => void
}

export function AudioVisualizer({
  stream,
  isRecording,
  onClick,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Start visualizing while recording; the cleanup stops the animation and
  // closes the audio context when recording stops or the stream changes.
  useEffect(() => {
    if (!stream || !isRecording) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let animationFrame: number | null = null
    let audioContext: AudioContext | null = null

    try {
      audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE
      analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING
      audioContext.createMediaStreamSource(stream).connect(analyser)

      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const bufferLength = analyser.frequencyBinCount
      const frequencyData = new Uint8Array(bufferLength)

      const drawFrame = () => {
        animationFrame = requestAnimationFrame(drawFrame)
        analyser.getByteFrequencyData(frequencyData)

        // Clear and measure in CSS pixels
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

        const barWidth = Math.max(
          AUDIO_CONFIG.MIN_BAR_WIDTH,
          canvas.width / dpr / bufferLength - AUDIO_CONFIG.BAR_SPACING
        )
        const centerY = canvas.height / dpr / 2
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const normalizedHeight = frequencyData[i] / 255
          const barHeight = Math.max(
            AUDIO_CONFIG.MIN_BAR_HEIGHT,
            normalizedHeight * centerY
          )
          drawBar(
            ctx,
            x,
            centerY,
            barWidth,
            barHeight,
            getBarColor(normalizedHeight)
          )
          x += barWidth + AUDIO_CONFIG.BAR_SPACING
        }
      }

      drawFrame()
    } catch (error) {
      console.error("Error starting visualization:", error)
    }

    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame)
      audioContext?.close()
    }
  }, [stream, isRecording])

  // Size the canvas to its container, accounting for device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      // Account for the 2px total margin (1px on each side)
      canvas.width = (rect.width - 2) * dpr
      canvas.height = (rect.height - 2) * dpr
      canvas.style.width = `${rect.width - 2}px`
      canvas.style.height = `${rect.height - 2}px`
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full cursor-pointer rounded-lg bg-background/80 backdrop-blur"
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
