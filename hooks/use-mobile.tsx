"use client"

import { useEffect, useState } from "react"

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial mount
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)
    
    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", checkIsMobile)
  }, []) // Empty dependency array ensures this runs only on the client, once

  return isMobile
}
