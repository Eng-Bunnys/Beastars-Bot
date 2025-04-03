export interface DownloadPage {
  chapterNumber: number;
  pageNumber: number;
  fileName: string;
  folderURL: string;
}

export interface ChapterFiles {
  chapterNumber: number;
  folderURL: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface DriveFolder extends DriveFile {}
