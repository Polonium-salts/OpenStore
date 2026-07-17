export interface PlatformDetails {
  available: boolean;
  download_url?: string | null;
  installer_type?: string | null;
  sha256?: string | null;
  silent_args?: string | null;
}

export interface Platforms {
  windows: PlatformDetails;
  macos: PlatformDetails;
  linux: PlatformDetails;
}

export interface OpenStoreApp {
  app_id: string;
  name: string;
  version: string;
  description: string;
  icon_url: string;
  developer: string;
  license: string;
  sources: string[];
  platforms: Platforms;
}

export interface UnifiedApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}
