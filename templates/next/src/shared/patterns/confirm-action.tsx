"use client"

import { useState } from "react"
import type { ReactElement } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function ConfirmAction({
  trigger,
  title,
  description,
  run,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
}: {
  trigger: ReactElement
  title: string
  description: string
  run: () => Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setError(undefined)
          setOpen(value)
        }
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={async (event) => {
              event.preventDefault()
              if (pending) return
              setPending(true)
              setError(undefined)
              try {
                await run()
                setOpen(false)
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "처리하지 못했습니다. 다시 시도해 주세요."
                )
              } finally {
                setPending(false)
              }
            }}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
