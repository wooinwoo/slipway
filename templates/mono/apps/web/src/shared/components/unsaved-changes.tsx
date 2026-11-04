// Asks before leaving a form with unsaved edits, for in-app navigation and for closing the tab.
// Usage inside a react-hook-form form: <UnsavedChangesGuard when={form.formState.isDirty && !form.formState.isSubmitting} />
import { useBlocker } from "@tanstack/react-router"

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/shared/ui/alert-dialog"

export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker({ shouldBlockFn: () => when, enableBeforeUnload: () => when, withResolver: true })
  return (
    <AlertDialog open={blocker.status === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>저장하지 않은 변경이 있습니다</AlertDialogTitle>
          <AlertDialogDescription>이대로 나가면 바꾼 내용이 사라집니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>계속 편집</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
