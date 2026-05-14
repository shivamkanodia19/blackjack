"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, Plus, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLiveRoom } from "@/hooks/useLiveRoom"

type View = "home" | "create" | "join"

export default function LiveLobbyPage() {
  const router = useRouter()
  const { createRoom, joinRoom, isLoading, error } = useLiveRoom(null)

  const [view, setView] = useState<View>("home")

  // Create form state
  const [createName, setCreateName] = useState("")
  const [createChips, setCreateChips] = useState("1000")

  // Join form state
  const [joinCode, setJoinCode] = useState("")
  const [joinName, setJoinName] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    const chips = parseInt(createChips, 10)
    const room = await createRoom(createName.trim(), {
      startingChips: isNaN(chips) || chips < 100 ? 1000 : chips,
    })
    if (room) {
      router.push(`/live/${room.id}`)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim() || !joinName.trim()) return
    const room = await joinRoom(joinCode.trim(), joinName.trim())
    if (room) {
      router.push(`/live/${room.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-violet-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-violet-200 hover:text-white hover:bg-violet-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-white font-bold text-xl tracking-tight">Live Room</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Error */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {view === "home" && (
            <div className="space-y-4">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-700 mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Play with Friends</h2>
                <p className="text-violet-300 mt-2">Create a room or join an existing one</p>
              </div>

              <Card className="bg-violet-900/50 border-violet-700 hover:bg-violet-900/70 transition-colors cursor-pointer"
                onClick={() => setView("create")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-400" />
                    Create Room
                  </CardTitle>
                  <CardDescription className="text-violet-300">
                    Start a new game room and invite friends with a code
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-violet-900/50 border-violet-700 hover:bg-violet-900/70 transition-colors cursor-pointer"
                onClick={() => setView("join")}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-violet-400" />
                    Join Room
                  </CardTitle>
                  <CardDescription className="text-violet-300">
                    Enter a room code to join a friend&apos;s game
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {view === "create" && (
            <Card className="bg-violet-900/60 border-violet-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-violet-400" />
                  Create Room
                </CardTitle>
                <CardDescription className="text-violet-300">
                  Set up your game room
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-violet-200">Your Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      maxLength={24}
                      className="bg-violet-950/50 border-violet-600 text-white placeholder:text-violet-400 focus:border-violet-400"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-violet-200">Starting Chips</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={createChips}
                      onChange={(e) => setCreateChips(e.target.value)}
                      min={100}
                      max={100000}
                      step={100}
                      className="bg-violet-950/50 border-violet-600 text-white placeholder:text-violet-400 focus:border-violet-400"
                    />
                    <p className="text-xs text-violet-400">Minimum 100 chips</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-violet-300 hover:text-white hover:bg-violet-800"
                      onClick={() => setView("home")}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                      disabled={isLoading || !createName.trim()}
                    >
                      {isLoading ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {view === "join" && (
            <Card className="bg-violet-900/60 border-violet-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-violet-400" />
                  Join Room
                </CardTitle>
                <CardDescription className="text-violet-300">
                  Enter the 6-character room code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-violet-200">Room Code</label>
                    <Input
                      placeholder="e.g. ABCDEF"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="bg-violet-950/50 border-violet-600 text-white placeholder:text-violet-400 focus:border-violet-400 uppercase tracking-widest font-mono text-lg"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-violet-200">Your Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      maxLength={24}
                      className="bg-violet-950/50 border-violet-600 text-white placeholder:text-violet-400 focus:border-violet-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-violet-300 hover:text-white hover:bg-violet-800"
                      onClick={() => setView("home")}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                      disabled={isLoading || !joinCode.trim() || !joinName.trim()}
                    >
                      {isLoading ? "Joining..." : "Join Room"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
