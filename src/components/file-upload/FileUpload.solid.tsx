import { UploadFile, createDropzone, createFileUploader } from "@solid-primitives/upload"
import { createMemo, createSignal } from "solid-js"
import { ffmpeg, loadFfmpeg } from "../../signals/ffmpeg"
import { fetchFile } from "@ffmpeg/ffmpeg"

type State =
  | 'empty'
  | 'loading'
  | 'loaded'

type DragState =
  | 'ok'
  | 'warning - multiple files'
  | 'invalid - no files'

const DEFAULT_MESSAGE = 'drag file here or browse for file upload'
const NO_FILE_MESSAGE = 'no file detected!'
const MULTIPLE_FILE_MESSAGE = 'can only upload 1 file at a time!'

export function FileUpload() {
  const [file, setFile] = createSignal<File | null>(null)
  const [fileState, setFileState] = createSignal<State>('empty')
  const [dragState, setDragState] = createSignal<DragState>('ok')
  
  const [message, setMessage] = createSignal(DEFAULT_MESSAGE)
  const { files, selectFiles } = createFileUploader({ multiple: false, accept: ".mp4,.mov,.avi,.webm,.mkv" })

  function resolveDragState(files: UploadFile[]) {
    if (files.length === 0) { setDragState('invalid - no files') }
    else if (files.length > 1) { setDragState('warning - multiple files' ) }
    else { setDragState('ok') } 
  }
  const { setRef: dropzoneRef, files: droppedFiles, isDragging } = createDropzone({
    onDrop: async files => {
      if (files.length === 0) { return }
      setFile(files[0].file)
    },
    onDragEnter: files => {
      resolveDragState(files)
    },
    onDragLeave: files => {
      resolveDragState(files)
    },
    onDragStart: files => {
      resolveDragState(files)
    },
    onDragEnd: files => {
      resolveDragState(files)
    }
  })

  const m = createMemo(() => {
    if (isDragging()) {
      switch (dragState()) {
        case 'ok': return DEFAULT_MESSAGE
        case 'warning - multiple files': return MULTIPLE_FILE_MESSAGE
        case 'invalid - no files': return NO_FILE_MESSAGE 
        default: return DEFAULT_MESSAGE
      }
    }
    return file()?.name ?? DEFAULT_MESSAGE 
  })

  const [progress, setProgress] = createSignal<number | undefined>(undefined)
  const [convertedUrl, setConvertedUrl] = createSignal<string | undefined>(undefined)
  
  async function convert() {
    console.log('starting convert')
    console.log('loading ffmpeg')
    await loadFfmpeg()
    const _ffmpeg = ffmpeg()
    const f = file()
    console.log('processing file')
    _ffmpeg.FS('writeFile', f.name, await fetchFile(f))
    _ffmpeg.setProgress(p => { console.log('progress', p); setProgress(Math.floor(p.ratio * 100) / 2) })
    // await _ffmpeg.run('-i', f.name, 'output.mp4')
    // const data = _ffmpeg.FS('readFile', 'output.mp4')
    // const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
    await _ffmpeg.run('-i', f.name, '-filter_complex', "[0:v] palettegen", 'palette.png')
    _ffmpeg.setProgress(p => { console.log('progress2', p); setProgress(50 + Math.floor(p.ratio * 100) / 2)})
    await _ffmpeg.run('-i', f.name, '-i', 'palette.png', '-filter_complex', '[0:v][1:v] paletteuse', 'output.gif')
    const data = _ffmpeg.FS('readFile', 'output.gif')
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }))
    console.log(url)
    setConvertedUrl(url)
  }

  return (
    <>
      <button
        ref={dropzoneRef}
        class="
          [&_*]:pointer-events-none
          p-4 w-full basis-48
          flex items-center justify-center
          rounded-lg border-2 border-gray-300 border-dashed
        "
        onClick={() => {
          selectFiles(files => {
            if (files.length !== 1) { return }
            console.log(files)
            setFile(files[0].file)
          })
        }}
      >
          <span>{m()}</span>
      </button>
      <div class="flex justify-center items-center gap-4">
        <button
          disabled={!file()}
          onClick={convert}
          class="
            px-2 py-1
            rounded-lg
            bg-green-600 text-white
            disabled:cursor-not-allowed disabled:bg-gray-300"
        >{progress() === undefined ? 'convert' : `convert (${progress()}%)`}</button>
        <button
          disabled={!convertedUrl()}
          class="
            px-2 py-1
            rounded-lg
            bg-blue-600 text-white
            disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <a download href={convertedUrl()}>download</a>
        </button>
      </div>
    </>
  )
}