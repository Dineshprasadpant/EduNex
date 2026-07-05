"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef(function Avatar(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
})

const AvatarImage = React.forwardRef(function AvatarImage(
  { className, src, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>,
  ref: React.ForwardedRef<HTMLImageElement>
) {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  )
})

const AvatarFallback = React.forwardRef(function AvatarFallback(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  )
})

export { Avatar, AvatarImage, AvatarFallback }