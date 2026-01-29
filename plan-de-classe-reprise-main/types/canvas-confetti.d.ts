declare module "canvas-confetti" {
  export interface Options {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    origin?: {
      x?: number
      y?: number
    }
    colors?: string[]
    shapes?: string[]
    scalar?: number
    zIndex?: number
    disableForReducedMotion?: boolean
  }

  export type CreateTypes = {
    canvas: HTMLCanvasElement
    confetti: (options?: Options) => Promise<void>
    reset: () => void
  }

  export default function confetti(options?: Options): Promise<void>
  export function create(canvas: HTMLCanvasElement, options?: { resize?: boolean; useWorker?: boolean }): CreateTypes
  export function reset(): void
}
