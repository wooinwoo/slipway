import { useRef, useState } from "react"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  parseCsv,
  stringifyCsv,
  type CsvColumn,
  type CsvDocument,
} from "@/shared/lib/csv"

export function CsvImport({
  onImport,
  maxBytes = 2000000,
  maxRows = 10000,
  previewRows = 5,
}: {
  onImport: (document: CsvDocument) => Promise<void>
  maxBytes?: number
  maxRows?: number
  previewRows?: number
}) {
  const [document, setDocument] = useState<CsvDocument>(),
    [error, setError] = useState<string>(),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false)
  const request = useRef(0),
    input = useRef<HTMLInputElement>(null)
  return (
    <div className="grid min-w-0 gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UploadIcon className="size-4" />
        CSV 가져오기
      </div>
      <Input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        aria-label="CSV 파일"
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0],
            current = ++request.current
          setError(undefined)
          setDocument(undefined)
          setDone(false)
          setBusy(false)
          if (!file) return
          if (file.size > maxBytes) {
            setError("CSV 파일이 너무 큽니다")
            return
          }
          setBusy(true)
          try {
            const parsed = parseCsv(await file.text(), {
              maxRows,
              maxChars: maxBytes,
            })
            if (request.current === current) setDocument(parsed)
          } catch (failure) {
            if (request.current === current)
              setError(
                failure instanceof Error
                  ? failure.message
                  : "CSV를 읽지 못했습니다"
              )
          } finally {
            if (request.current === current) setBusy(false)
          }
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-muted-foreground">
          가져오기를 완료했습니다
        </p>
      )}
      {document && (
        <>
          <p className="text-xs text-muted-foreground">
            {document.rows.length}행 · {document.headers.length}열 · 미리보기
            최대 {previewRows}행
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {document.headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.rows
                  .slice(0, Math.max(0, previewRows))
                  .map((row, i) => (
                    <TableRow key={i}>
                      {row.map((value, index) => (
                        <TableCell key={index} className="max-w-56 truncate">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <Button
            disabled={busy || !document.rows.length}
            onClick={async () => {
              if (busy) return
              setBusy(true)
              setError(undefined)
              try {
                await onImport({
                  headers: [...document.headers],
                  rows: document.rows.map((row) => [...row]),
                })
                setDocument(undefined)
                setDone(true)
                if (input.current) input.current.value = ""
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "가져오지 못했습니다. 다시 시도해 주세요."
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "처리 중…" : `${document.rows.length}행 가져오기`}
          </Button>
        </>
      )}
    </div>
  )
}

export function CsvExportButton<T>({
  rows,
  columns,
  filename = "export.csv",
  label = "CSV 내보내기",
  disabled = false,
}: {
  rows: T[]
  columns: CsvColumn<T>[]
  filename?: string
  label?: string
  disabled?: boolean
}) {
  const [error, setError] = useState<string>()
  return (
    <span className="inline-grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setError(undefined)
          try {
            const csv = stringifyCsv(columns, rows),
              url = URL.createObjectURL(
                new Blob([csv], { type: "text/csv;charset=utf-8" })
              )
            const link = window.document.createElement("a")
            link.href = url
            link.download = filename
              .replace(/[\\/:*?"<>|]/g, "_")
              .replace(/(?:\.csv)?$/i, ".csv")
            window.document.body.append(link)
            link.click()
            link.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          } catch (failure) {
            setError(
              failure instanceof Error ? failure.message : "내보내지 못했습니다"
            )
          }
        }}
      >
        <DownloadIcon />
        {label}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  )
}
