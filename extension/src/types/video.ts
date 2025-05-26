export enum VideoEventType {
  PAUSE = 'pause',
  PLAY = 'play'
}

export interface VideoDetectorConfig {
  enableLogging?: boolean;
  logPrefix?: string;
}

export interface VideoEventData {
  type: VideoEventType;
  videoElement?: HTMLVideoElement;
}