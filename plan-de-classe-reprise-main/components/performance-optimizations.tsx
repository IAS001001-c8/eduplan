"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Optimiser les composants de carte avec React.memo
export const OptimizedCard = memo(Card)
export const OptimizedCardHeader = memo(CardHeader)
export const OptimizedCardContent = memo(CardContent)
export const OptimizedCardFooter = memo(CardFooter)
export const OptimizedCardTitle = memo(CardTitle)
export const OptimizedCardDescription = memo(CardDescription)
export const OptimizedButton = memo(Button)

// Fonction utilitaire pour limiter les appels de fonction (throttle)
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false
  let lastResult: ReturnType<T>

  return function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      lastResult = func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
    return lastResult
  }
}

// Fonction utilitaire pour retarder les appels de fonction (debounce)
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null
      func.apply(this, args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}
