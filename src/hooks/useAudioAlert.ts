import { useCallback, useState } from "react";

/**
 * Staff notification chime. Safe if `/notification.mp3` is missing, corrupt,
 * or the browser blocks playback — never throws into React.
 */
export function useAudioAlert() {
	const [audioEnabled, setAudioEnabled] = useState(false);

	const playNotificationSound = useCallback(() => {
		if (!audioEnabled) return;
		try {
			const windowAudioContext = window.AudioContext || (window as any).webkitAudioContext;
			if (!windowAudioContext) return;
			const ctx = new windowAudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
			gain.gain.setValueAtTime(0.1, ctx.currentTime); // Gentle volume
			osc.start();
			osc.stop(ctx.currentTime + 0.15); // Short ding
		} catch (err) {
			console.warn("Audio Context blocked:", err);
		}
	}, [audioEnabled]);

	const enableAudio = useCallback(() => {
		setAudioEnabled(true);
		try {
			const windowAudioContext = window.AudioContext || (window as any).webkitAudioContext;
			if (!windowAudioContext) return;
			const ctx = new windowAudioContext();
			// Just resume/start context on user gesture
			void ctx.resume();
		} catch (err) {
			console.warn("Audio Context init blocked:", err);
		}
	}, []);

	return {
		audioEnabled,
		enableAudio,
		playNotificationSound,
	};
}
