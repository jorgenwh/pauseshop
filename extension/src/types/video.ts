export enum VideoEventType {
    PAUSE = "pause",
    PLAY = "play",
    SEEKING = "seeking",
    SEEKED = "seeked",
}

export interface VideoEventData {
    type: VideoEventType;
    videoElement?: HTMLVideoElement;
}

export interface SeekingState {
    isSeeking: boolean;
    lastSeekTime: number;
    debounceTimeoutId: number | null;
    pauseDebounceTimeoutId: number | null;
    previousCurrentTime: number;
    userInteractionDetected: boolean;
    lastInteractionTime: number;
    currentPauseId: string | null;
}
