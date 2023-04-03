import { createMemo, createSignal, onMount } from "solid-js"
import { FFmpeg, createFFmpeg } from "@ffmpeg/ffmpeg"

const [_ffmpeg, set] = createSignal<FFmpeg | undefined>(undefined)

onMount(() => {
  let __ffmpeg = createFFmpeg({ log: true })
  
  __ffmpeg
    .load()
    .then(() => { set(__ffmpeg) })
})

export const ffmpeg = createMemo(() => _ffmpeg())
export const loadFfmpeg = async () => {
  if (!_ffmpeg) {
    let __ffmpeg = createFFmpeg({ log: true })
    await __ffmpeg.load();
    set(__ffmpeg)
  }
}