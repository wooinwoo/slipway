import { useId, useState } from "react"
import type { ReactNode } from "react"
import { FileIcon, UploadIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FileDrop({
  files,
  onChange,
  accept,
  maxBytes = 10 * 1024 * 1024,
  maxFiles = 5,
  disabled = false,
  renderPreview,
}: {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  maxBytes?: number
  maxFiles?: number
  disabled?: boolean
  renderPreview?: (file: File) => ReactNode
}) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string>()
  function select(incoming: File[]) {
    if (disabled) return
    const rules = accept
      ?.toLowerCase()
      .split(",")
      .map((rule) => rule.trim())
      .filter(Boolean)
    const rejected = incoming.find(
      (file) =>
        file.size > maxBytes ||
        (rules?.length &&
          !rules.some((rule) =>
            rule.startsWith(".")
              ? file.name.toLowerCase().endsWith(rule)
              : rule.endsWith("/*")
                ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
                : file.type.toLowerCase() === rule
          ))
    )
    if (rejected) {
      setError(`${rejected.name}: 파일 형식 또는 크기를 확인해 주세요.`)
      return
    }
    const next = [...files]
    for (const file of incoming)
      if (
        !next.some(
          (old) =>
            old.name === file.name &&
            old.size === file.size &&
            old.lastModified === file.lastModified
        )
      )
        next.push(file)
    if (next.length > maxFiles) {
      setError(`파일은 최대 ${maxFiles}개까지 선택할 수 있습니다.`)
      return
    }
    setError(undefined)
    onChange(next)
  }
  return (
    <div className="grid gap-3">
      <div
        className={`rounded-xl border-2 border-dashed p-7 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"} ${disabled ? "opacity-50" : ""}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          select(Array.from(event.dataTransfer.files))
        }}
      >
        <label
          htmlFor={id}
          className="grid cursor-pointer justify-items-center gap-2 rounded-sm focus-within:ring-2 focus-within:ring-ring"
        >
          <UploadIcon className="mb-1 size-6 text-muted-foreground" />
          <span className="text-sm font-medium">파일 선택</span>
          <span className="text-xs text-muted-foreground">
            파일을 끌어 놓거나 눌러서 선택하세요.
          </span>
          <span className="text-xs text-muted-foreground">
            최대 {maxFiles}개 · 파일당{" "}
            {Math.round(maxBytes / 1024).toLocaleString("ko-KR")} KB
          </span>
          <input
            id={id}
            aria-label="파일 선택"
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              select(Array.from(event.target.files ?? []))
              event.target.value = ""
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <ul className="grid gap-2">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.lastModified}-${index}`}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            {renderPreview?.(file) ?? (
              <FileIcon className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.ceil(file.size / 1024).toLocaleString("ko-KR")} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${file.name} 제거`}
              disabled={disabled}
              onClick={() => {
                setError(undefined)
                onChange(files.filter((_, i) => i !== index))
              }}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
