export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  message: string;
  timestamp: number;
  generated?: boolean;
}

export interface UserLocation extends Coordinates {
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

export enum AppView {
  MAP = 'MAP',
  LIST = 'LIST',
}
