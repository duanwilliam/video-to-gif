import { Accessor, JSX, createSignal, onCleanup, onMount } from "solid-js"
import { isServer } from "solid-js/web"

export type DropzoneUpload<T extends HTMLElement = HTMLElement> = {
  setRef: (ref: T) => void
  files: Accessor<File[]>
  isDragging: Accessor<boolean>
  clearFiles: () => void
}

type Callback = (files: File[]) => void | Promise<void>;

const noop = () => {}

export type DropzoneUploadOptions = {
  accept?: string | string[]
  multiple?: boolean
  onClick?: Callback

  onDragStart?: Callback
  onDragEnd?: Callback
  onDragEnter?: Callback
  onDragLeave?: Callback
  onDragOver?: Callback
  onDrag?: Callback
  onDrop?: Callback
}

export function createDropzoneUpload<O extends DropzoneUploadOptions, T extends HTMLElement = HTMLElement>(
  options?: O
): DropzoneUpload {
  if (isServer) {
    return {
      setRef: noop,
      files: () => [],
      isDragging: () => false,
      clearFiles: noop,
    }
  }
  let ref: T | undefined = undefined

  const [files, setFiles] = createSignal<File[]>([])
  const setRef = (r: T) => { ref = r }
  

  const [isDragging, setIsDragging] = createSignal(false)

  const onDragStart: JSX.EventHandler<T, DragEvent> = e => {
    setIsDragging(true)
    Promise.resolve(options?.onDragStart?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDragEnd: JSX.EventHandler<T, DragEvent> = e => {
    setIsDragging(false)
    Promise.resolve(options?.onDragEnd?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDragEnter: JSX.EventHandler<T, DragEvent> = e => {
    // e.stopPropagation()
    e.stopImmediatePropagation()
    Promise.resolve(options?.onDragEnter?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDragLeave: JSX.EventHandler<T, DragEvent> = e => {
    e.stopPropagation()
    Promise.resolve(options?.onDragLeave?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDragOver: JSX.EventHandler<T, DragEvent> = e => {
    e.preventDefault()
    Promise.resolve(options?.onDragOver?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDrag: JSX.EventHandler<T, DragEvent> = e => {
    Promise.resolve(options?.onDrag?.(parseFiles(e.dataTransfer?.files)))
  }
  const onDrop: JSX.EventHandler<T, DragEvent> = e => {
    e.preventDefault()

    const parsedFiles = parseFiles(e.dataTransfer?.files)
    setFiles(parsedFiles)
    Promise.resolve(options?.onDrop?.(parsedFiles))
  }

  onMount(() => {
    if (!ref) { return }

    ref.addEventListener('dragstart', onDragStart)
    ref.addEventListener("dragenter", onDragEnter)
    ref.addEventListener("dragend", onDragEnd);
    ref.addEventListener("dragleave", onDragLeave)
    ref.addEventListener("dragover", onDragOver)
    ref.addEventListener("drag", onDrag)
    ref.addEventListener("drop", onDrop)

    onCleanup(() => {
      ref?.removeEventListener("dragstart", onDragStart)
      ref?.removeEventListener("dragenter", onDragEnter)
      ref?.removeEventListener("dragend", onDragEnd)
      ref?.removeEventListener("dragleave", onDragLeave)
      ref?.removeEventListener("dragover", onDragOver)
      ref?.removeEventListener("drag", onDrag)
      ref?.removeEventListener("drop", onDrop)
    })
  })

  const clearFiles = () => { setFiles([]) }

  return {
    setRef,
    files,
    isDragging,
    clearFiles,
  }
}

function parseFiles(files:FileList | null): File[] {
  return !files ? [] : Array.from(files)
}