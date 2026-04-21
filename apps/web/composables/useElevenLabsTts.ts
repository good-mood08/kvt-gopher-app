import { useTts } from './useTts'

/**
 * Backward-compatible name (was originally ElevenLabs-only).
 * Now it calls the shared `/api/tts` endpoint which may use Yandex SpeechKit.
 */
export function useElevenLabsTts() {
  return useTts()
}
