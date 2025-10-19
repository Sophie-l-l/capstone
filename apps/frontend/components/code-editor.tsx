"use client"

import { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, readOnly = false }: CodeEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(value) => onChange(value || "")}
      theme={theme === "dark" ? "vs-dark" : "light"}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        readOnly,
        padding: { top: 16, bottom: 16 },
      }}
    />
  )
}
