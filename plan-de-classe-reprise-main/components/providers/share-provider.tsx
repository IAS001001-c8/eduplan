"use client"

import type React from "react"

import { createContext, useContext } from "react"

interface ShareContextProps {
  classCode?: string
  className?: string
  roomId?: string
  roomName?: string
}

const ShareContext = createContext<ShareContextProps>({})

export const ShareProvider = ({ children, value }: { children: React.ReactNode; value: ShareContextProps }) => {
  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>
}

export const useShare = () => useContext(ShareContext)
