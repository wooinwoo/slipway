export type CsvDocument = { headers: string[]; rows: string[][] }
export type CsvScalar = string | number | boolean | null | undefined
export type CsvColumn<T> = {
  key: string
  label: string
  value: (row: T) => CsvScalar
}

export function parseCsv(
  input: string,
  {
    delimiter = ",",
    maxRows = 10000,
    maxColumns = 200,
    maxChars = 2000000,
  }: {
    delimiter?: string
    maxRows?: number
    maxColumns?: number
    maxChars?: number
  } = {}
): CsvDocument {
  if (delimiter.length !== 1 || /["\r\n]/.test(delimiter))
    throw new Error("구분자는 따옴표와 줄바꿈을 제외한 한 글자여야 합니다")
  if (input.length > maxChars) throw new Error("CSV 파일이 너무 큽니다")
  const source = input.replace(/^\uFEFF/, ""),
    records: string[][] = []
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false,
    started = false
  function field() {
    row.push(cell)
    if (row.length > maxColumns) throw new Error("CSV 열 제한을 초과했습니다")
    cell = ""
    closed = false
    started = false
  }
  function record() {
    if (started || row.length || cell) {
      field()
      records.push(row)
      if (records.length > maxRows + 1)
        throw new Error("CSV 행 제한을 초과했습니다")
    }
    row = []
  }
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
          closed = true
        }
      } else cell += char
      continue
    }
    if (closed && char !== delimiter && char !== "\r" && char !== "\n")
      throw new Error("닫는 따옴표 뒤의 문자를 확인해 주세요")
    if (char === delimiter) field()
    else if (char === "\r" || char === "\n") {
      record()
      if (char === "\r" && source[i + 1] === "\n") i++
    } else if (char === '"') {
      if (started) throw new Error("필드 안의 따옴표는 두 번 써야 합니다")
      quoted = true
      started = true
    } else {
      cell += char
      started = true
    }
  }
  if (quoted) throw new Error("닫히지 않은 따옴표가 있습니다")
  record()
  if (!records.length) throw new Error("CSV 헤더가 없습니다")
  const headers = records[0].map((value) => value.trim())
  if (
    headers.some((value) => !value) ||
    new Set(headers).size !== headers.length
  )
    throw new Error("빈 헤더나 중복 헤더가 있습니다")
  const rows = records.slice(1)
  const mismatch = rows.findIndex((value) => value.length !== headers.length)
  if (mismatch >= 0)
    throw new Error(`${mismatch + 2}행의 열 수가 헤더와 다릅니다`)
  return { headers, rows }
}

/** Spreadsheet formula protection applies to strings; numeric negatives stay numbers. */
export function stringifyCsv<T>(
  columns: readonly CsvColumn<T>[],
  rows: readonly T[],
  {
    delimiter = ",",
    bom = true,
    protectFormulas = true,
  }: { delimiter?: string; bom?: boolean; protectFormulas?: boolean } = {}
): string {
  if (delimiter.length !== 1 || /["\r\n]/.test(delimiter))
    throw new Error("잘못된 CSV 구분자입니다")
  if (!columns.length) throw new Error("내보낼 열이 없습니다")
  const encode = (value: CsvScalar) => {
    let text = value == null ? "" : String(value)
    if (
      protectFormulas &&
      typeof value === "string" &&
      /^\s*[=+\-@]/.test(text)
    )
      text = "'" + text
    return text === "" || text.includes(delimiter) || /["\r\n]/.test(text)
      ? '"' + text.replaceAll('"', '""') + '"'
      : text
  }
  return (
    (bom ? "\uFEFF" : "") +
    [
      columns.map((column) => encode(column.label)).join(delimiter),
      ...rows.map((row) =>
        columns.map((column) => encode(column.value(row))).join(delimiter)
      ),
    ].join("\r\n") +
    "\r\n"
  )
}
