import { useState, useCallback } from "react";

export function useAudioAlert() {
	const [audioEnabled, setAudioEnabled] = useState(false);

	const playNotificationSound = useCallback(() => {
		if (!audioEnabled) return;
		try {
			const AudioContextClass =
				window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioContextClass) return;
			const ctx = new AudioContextClass();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = "sine";
			// 880Hz is a classic pleasant notification chime frequency (A5)
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			gain.gain.setValueAtTime(0.2, ctx.currentTime);
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
		} catch (e) {
			console.error("Audio play failed", e);
		}
	}, [audioEnabled]);

	const enableAudio = useCallback(() => {
		setAudioEnabled(true);
		try {
			const AudioContextClass =
				window.AudioContext || (window as any).webkitAudioContext;
			if (AudioContextClass) {
				const ctx = new AudioContextClass();
				ctx.resume();
			}
		} catch (e) {
			console.error("Audio Context initialization failed", e);
		}
	}, []);

	return {
		audioEnabled,
		enableAudio,
		playNotificationSound,
	};
}
