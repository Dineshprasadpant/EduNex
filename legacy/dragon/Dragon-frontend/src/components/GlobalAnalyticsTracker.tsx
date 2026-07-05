'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function GlobalAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasTracked = useRef(false)

  useEffect(() => {
    // Only track on first load
    if (hasTracked.current) return

    const trackVisit = async () => {
      try {
        hasTracked.current = true

        // Get source from URL params
        const source = searchParams.get('source') || 'direct'

        // Check for existing user cookies
        const userCookie = Cookies.get('user') // For logged-in users
        const visitorCookie = Cookies.get('visitor') // For anonymous visitors

        let isNewVisitor = false
        let userId: string
        let userType: 'visitor' | 'user'

        if (userCookie) {
          // Existing logged-in user
          userType = 'user'
          userId = JSON.parse(userCookie.toString()).id
          isNewVisitor = false
        } else if (visitorCookie) {
          // Returning visitor (not logged in)
          userType = 'visitor'
          userId = JSON.parse(visitorCookie.toString()).id
          isNewVisitor = false
        } else {
          // New visitor - create anonymous visitor
          userType = 'visitor'
          isNewVisitor = true
          userId = `anon_${crypto.randomUUID().slice(0, 8)}`

          // Set visitor cookie (not user cookie)
          Cookies.set('visitor', JSON.stringify({
            id: userId,
            createdAt: new Date().toISOString()
          }), {
            expires: 365, // 1 year
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
        }

        // Send visit data to analytics API
        await fetch(`${BASE_URL}/analytics/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isNewVisitor,
            source,
            userId,
            userType,
            path: pathname,
            referrer: document.referrer || '',
            userAgent: navigator.userAgent,
            isInitialLoad: true
          })
        })

      } catch (error) {
        console.error('Analytics tracking error:', error)
      }
    }

    trackVisit()
  }, []) // Empty dependency array ensures this runs only once

  return null
}