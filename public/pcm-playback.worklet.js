/**
 * Gap-free Gemini PCM playback. Main thread pushes Float32 samples at the
 * AudioContext sample rate; this processor writes them continuously so we
 * never start/stop BufferSource nodes (those clicks sound like crackle).
 */
class PcmPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._chunks = [];
    this._offset = 0;
    this._frames = 0;
    this._ready = false;
    this._playing = false;
    this._prebuffer = Math.floor(sampleRate * 0.08);
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === "push" && data.samples) {
        const samples = data.samples;
        this._chunks.push(samples);
        this._frames += samples.length;
        if (!this._ready && this._frames >= this._prebuffer) {
          this._ready = true;
        }
      } else if (data.type === "clear") {
        this._chunks = [];
        this._offset = 0;
        this._frames = 0;
        this._ready = false;
        this._playing = false;
      }
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0] && outputs[0][0];
    if (!out) return true;

    if (!this._ready) {
      out.fill(0);
      return true;
    }

    this._playing = true;
    let written = 0;
    while (written < out.length && this._chunks.length > 0) {
      const chunk = this._chunks[0];
      const remain = chunk.length - this._offset;
      const take = Math.min(remain, out.length - written);
      out.set(chunk.subarray(this._offset, this._offset + take), written);
      this._offset += take;
      written += take;
      this._frames -= take;
      if (this._offset >= chunk.length) {
        this._chunks.shift();
        this._offset = 0;
      }
    }

    if (written < out.length) {
      out.fill(0, written);
      this._ready = false;
      if (this._playing) {
        this._playing = false;
        this.port.postMessage({ type: "drained" });
      }
    }

    return true;
  }
}

registerProcessor("pcm-playback", PcmPlaybackProcessor);
