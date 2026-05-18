"use client"

import * as React from "react"
// Using native input range as a lightweight replacement for @radix-ui/react-slider

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'>
>(({ className, ...props }, ref) => (
  <div className={cn("relative w-full", className)}>
    <input
      ref={ref}
      type="range"
      className="w-full appearance-none h-2 rounded-full bg-secondary disabled:opacity-50"
      {...props}
    />
  </div>
))
Slider.displayName = 'Slider'

export { Slider }
