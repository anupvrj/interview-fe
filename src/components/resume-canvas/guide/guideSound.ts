/**
 * The tour cursor's soft "tick" — synthesized with Web Audio (no audio file). Browsers only
 * allow sound after the user has clicked something; the tour always starts from a click
 * ("Start the tour", "Show me", "?"), and `unlockSound` is called from those clicks.
 * Muting is remembered in this browser.
 */
const MUTE_KEY = "ix:editorGuide:muted";
let ctx: AudioContext | null = null;

export function soundMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, "1");
    else window.localStorage.removeItem(MUTE_KEY);
  } catch {
    /* private mode */
  }
}

/** Call from a click handler so later ticks are allowed to play. */
export function unlockSound(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** A short, quiet mouse-click tick. Silent if muted, blocked, or unsupported. */
export function playClick(): void {
  if (!ctx || ctx.state !== "running" || soundMuted()) return;
  try {
    const now = ctx.currentTime;
    // Body: a quick pitch drop. Snap: a few ms of filtered noise on top.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.045);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);

    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.012), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    src.buffer = noise;
    hp.type = "highpass";
    hp.frequency.value = 2500;
    ng.gain.value = 0.06;
    src.connect(hp).connect(ng).connect(ctx.destination);
    src.start(now);
  } catch {
    /* audio is a nice-to-have */
  }
}
