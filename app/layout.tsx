import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Felt — Play Cards Sharper",
  description: "Play-money poker and blackjack. AI opponents, strategy coaching, private tables with friends. No real money involved.",
  generator: "Felt",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
