"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, GamepadIcon, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Suspense } from "react"

function HomeContent() {
  const [searchInput, setSearchInput] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("americas")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchInput.trim()) return

    setIsLoading(true)

    try {
      const parts = searchInput.trim().split("#")
      if (parts.length !== 2) {
        alert("Please enter your Riot ID in the format: GameName#TAG")
        return
      }

      const gameName = parts[0].trim()
      const tagLine = parts[1].trim()

      router.push(`/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?region=${selectedRegion}`)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
          <source src="/bg/champion-kayn-slayer-animated.webm" type="video/webm" />
          <source src="/bg/animated-freljord.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 "></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20">
          <div className="backdrop-blur-md bg-white/12 border-b border-white/25">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GamepadIcon className="h-7 w-7 text-white" />
                  <h1 className="text-lg font-semibold text-white">LoL Analytics</h1>
                </div>
                <div className="text-white text-sm font-medium">Player Performance Insights</div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-screen px-6">
          <div className="w-full max-w-2xl text-center">
            {/* Heading */}
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Analyze Your Performance</h2>
            <p className="text-lg text-white mb-12 leading-relaxed">
              Track stats, champion mastery, and climb the ranked ladder with detailed insights
            </p>

            {/* Riot Sign In Button */}
            <div className="mb-8">
              <Button
                onClick={() => {
                  const clientId = process.env.NEXT_PUBLIC_RIOT_CLIENT_ID || ""
                  const redirectUri =
                    typeof window !== "undefined" ? `${window.location.origin}/api/auth/riot/callback` : ""
                  const state = Math.random().toString(36).substring(2, 15)

                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("riot_oauth_state", state)
                  }

                  const authUrl = `https://auth.riotgames.com/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+offline_access&state=${state}`

                  if (clientId) {
                    window.location.href = authUrl
                  } else {
                    alert("Riot Sign On is not configured.")
                  }
                }}
                className="px-8 py-3 text-base font-semibold bg-slate-900 hover:bg-slate-950 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In with Riot
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-white"></div>
              <span className="text-white text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-white"></div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Region Select */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border-2 border-slate-300/60 text-slate-900 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                <option value="americas">Americas</option>
                <option value="asia">Asia</option>
                <option value="europe">Europe</option>
              </select>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600" />
                <Input
                  type="text"
                  placeholder="GameName#TAG"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 bg-white/70 backdrop-blur-sm border-2 border-slate-300/60 text-slate-900 placeholder-slate-600 font-medium rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="w-full px-6 py-3 text-base font-semibold bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  "Analyze Player"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white/80">
          <div className="text-slate-900 text-lg">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
