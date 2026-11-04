// Inputs for Korean data. Each takes and returns the stored value (formatted string or
// number), so they drop straight into <FormField> or any controlled form.
import { SearchIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { toast } from "sonner"

import { Input } from "@/shared/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/shared/ui/input-group"
import { formatBizNo, formatPhone, formatWonKorean } from "@/shared/lib/kr"

type Controlled<V> = Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: V
  onChange: (value: V) => void
}

export function PhoneInput({ value, onChange, ...props }: Controlled<string>) {
  return (
    <Input
      inputMode="tel"
      autoComplete="tel"
      placeholder="010-0000-0000"
      value={value}
      onChange={(e) => onChange(formatPhone(e.target.value))}
      {...props}
    />
  )
}

export function BizNoInput({ value, onChange, ...props }: Controlled<string>) {
  return (
    <Input
      inputMode="numeric"
      placeholder="000-00-00000"
      value={value}
      onChange={(e) => onChange(formatBizNo(e.target.value))}
      {...props}
    />
  )
}

/** Amount in won with thousands separators, plus the spoken form underneath (1억 2,500만원). */
export function WonInput({ value, onChange, ...props }: Controlled<number>) {
  return (
    <div className="grid gap-1.5">
      <InputGroup>
        <InputGroupInput
          inputMode="numeric"
          className="tabular text-right"
          placeholder="0"
          value={value ? value.toLocaleString("ko-KR") : ""}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "").slice(0, 15)) || 0)}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>원</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {value > 0 && <p className="text-xs text-muted-foreground tabular">{formatWonKorean(value)}</p>}
    </div>
  )
}

type DaumPostcodeResult = { roadAddress: string; jibunAddress: string; zonecode: string }
declare global {
  interface Window {
    daum?: { Postcode: new (options: { oncomplete: (data: DaumPostcodeResult) => void }) => { open: () => void } }
  }
}

let postcodeScript: Promise<void> | undefined
function loadPostcode() {
  postcodeScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
    script.onload = () => resolve()
    script.onerror = () => {
      postcodeScript = undefined
      reject(new Error("주소 검색을 불러오지 못했습니다"))
    }
    document.head.append(script)
  })
  return postcodeScript
}

/** Free text, or pick from the Kakao (Daum) postcode popup. No API key needed. */
export function AddressInput({ value, onChange, ...props }: Controlled<string>) {
  async function search() {
    try {
      await loadPostcode()
      new window.daum!.Postcode({ oncomplete: (data) => onChange(data.roadAddress || data.jibunAddress) }).open()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }
  return (
    <InputGroup>
      <InputGroupInput placeholder="주소 검색 또는 직접 입력" value={value} onChange={(e) => onChange(e.target.value)} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onClick={search}>
          <SearchIcon />
          검색
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
