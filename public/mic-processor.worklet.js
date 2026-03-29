/**
 * AudioWorklet processor for real-time microphone PCM capture.
 * Runs in a dedicated audio thread — more stable than ScriptProcessorNode.
 *
 * Receives Float32 samples at the browser's native sample rate, resamples to
 * 24 kHz using linear interpolation (to match Gemini's expected format),
 * converts to Int16 PCM, and posts base64-encoded chunks to the main thread.
 */
class MicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._targetSampleRate = (options.processorOptions && options.processorOptions.targetSampleRate) || 24000;
    this._sourceSampleRate = sampleRate; // global provided by AudioWorkletGlobalScope
    this._resampleRatio = this._targetSampleRate / this._sourceSampleRate;
    this._chunkCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputData = input[0]; // Float32Array, 1 channel

    // Resample to target sample rate (linear interpolation)
    let resampled;
    if (this._sourceSampleRate !== this._targetSampleRate) {
      const targetLength = Math.floor(inputData.length * this._resampleRatio);
      resampled = new Float32Array(targetLength);
      for (let i = 0; i < targetLength; i++) {
        const srcIdx = i / this._resampleRatio;
        const i0 = Math.floor(srcIdx);
        const i1 = Math.min(i0 + 1, inputData.length - 1);
        const frac = srcIdx - i0;
        resampled[i] = inputData[i0] * (1 - frac) + inputData[i1] * frac;
      }
    } else {
      resampled = inputData;
    }

    // Convert Float32 → Int16 PCM
    const pcm16 = new Int16Array(resampled.length);
    for (let i = 0; i < resampled.length; i++) {
      const s = Math.max(-1, Math.min(1, resampled[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Transfer the raw Int16Array buffer to the main thread (zero-copy via
    // transferable). btoa() is NOT available in the AudioWorklet global scope —
    // base64 encoding is done on the main thread in the onmessage handler.
    this._chunkCount++;
    this.port.postMessage(
      { type: "audio_chunk", pcm16: pcm16.buffer, chunkCount: this._chunkCount },
      [pcm16.buffer],  // transfer ownership — avoids a memory copy
    );

    return true; // Keep processor alive
  }
}

registerProcessor("mic-processor", MicProcessor);
