// A modest bitrate keeps new speech recordings small without server conversions.
export function createSpeechRecorder(stream: MediaStream, mimeType?: string): MediaRecorder {
  try {
    return new MediaRecorder(stream, {
      audioBitsPerSecond: 48000,
      ...(mimeType ? { mimeType } : {}),
    });
  } catch {
    return new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  }
}
