export enum VideoEventType {
    PAUSE = 'pause',
    PLAY = 'play',
    SEEKING = 'seeking',
    SEEKED = 'seeked'
}

export interface SeekingDetectionConfig {
    seekingDebounceMs: number;         // Time to wait after seeking before resuming normal detection
    timeJumpThreshold: number;         // Minimum time jump to consider as seeking (in seconds)
    enableTimeBasedDetection: boolean; // Enable fallback time-based seeking detection
}

export interface VideoDetectorConfig {
    enableLogging?: boolean;
    logPrefix?: string;
    seekingDetection?: Partial<SeekingDetectionConfig>;
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
}