import { google } from "googleapis";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import { drive_v3 } from "googleapis";
import path from "path";
import fs from "fs";

import {
  ChapterFiles,
  DownloadPage,
  DriveFile,
  DriveFolder,
} from "./DriveTypes";

dotenv.config();

const GoogleDriveKey = process.env.GoogleDriveKey;

/** Directory where downloaded manga pages will be stored */
const DOWNLOAD_DIR = path.join(process.cwd(), "drive");

/** Supported image MIME types for manga pages */
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
] as const;

export class DriveLogic {
  private drive: drive_v3.Drive;
  private authClient: OAuth2Client;

  constructor() {
    this.authClient = new google.auth.OAuth2();
    this.authClient.apiKey = GoogleDriveKey;
    this.drive = google.drive({ version: "v3", auth: this.authClient });

    if (!fs.existsSync(DOWNLOAD_DIR))
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  /**
   * Retrieves all chapter folders from a given Google Drive folder
   * @param {string} folderURL - URL of the parent folder containing chapter folders
   * @returns {Promise<DriveFolder[]>} Array of chapter folders sorted by chapter number
   * @throws {Error} If folder URL is invalid or API request fails
   */
  public async getFolders(folderURL: string) {
    const folderID = this.getFolderID(folderURL);

    if (!folderID) throw new Error("Invalid folder URL");

    try {
      const res = await this.drive.files.list({
        q: `'${folderID}' in parents and trashed=false`,
        fields: "files(id, name, mimeType, size)",
        pageSize: 1000,
      });

      const folderRegex = /Ch\. (\d+)(?: Vol\. \d+)?/;

      let chapters: DriveFolder[] = res.data.files
        ?.filter(
          (file) =>
            file.mimeType === "application/vnd.google-apps.folder" &&
            folderRegex.test(file.name)
        )
        .map((file) => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          size: file.size ? parseInt(file.size) : undefined,
        }));

      return (
        chapters?.sort((a, b) => {
          return this.getPageNumber(a.name) - this.getPageNumber(b.name);
        }) || []
      );
    } catch (error) {
      throw new Error(`Google Drive API Error\n${error}`);
    }
  }

  /**
   * Retrieves all image files from a specific chapter folder
   * @param {ChapterFiles} params - Parameters containing chapter number and folder URL
   * @returns {Promise<DriveFile[]>} Array of image files sorted by page number
   * @throws {Error} If chapter is not found or API request fails
   */
  public async getFilesFromChapter(params: ChapterFiles) {
    const { chapterNumber, folderURL } = params;

    const chapterFolders = await this.getFolders(folderURL);

    const chapterFolder = chapterFolders?.find((folder) =>
      new RegExp(`^Ch\\. 0*${chapterNumber}(?![\\.\\d])`).test(folder.name)
    );

    if (!chapterFolder)
      throw new Error(`Chapter number "${chapterNumber}" not found`);

    try {
      const res = await this.drive.files.list({
        q: `'${chapterFolder.id}' in parents and trashed=false`,
        fields: "files(id, name, mimeType, size)",
        pageSize: 1000,
      });

      const images: DriveFile[] = (res.data.files || [])
        .filter((file) =>
          IMAGE_MIME_TYPES.includes(
            file.mimeType as (typeof IMAGE_MIME_TYPES)[number]
          )
        )
        .map((file) => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          size: file.size ? parseInt(file.size) : undefined,
        }));

      return images.sort(
        (a, b) => this.getPageNumber(a.name) - this.getPageNumber(b.name)
      );
    } catch (error) {
      throw new Error(`Google Drive API Error\n${error}`);
    }
  }

  /**
   * Downloads a specific manga page and saves it locally
   * @param {DownloadPage} params - Parameters containing chapter, page numbers, and file details
   * @returns {Promise<string>} Path to the downloaded file
   * @throws {Error} If page is not found, download fails, or file operations fail
   */
  public async downloadPage(params: DownloadPage) {
    const { chapterNumber, pageNumber, fileName, folderURL } = params;
    const allFiles = await this.getFilesFromChapter({
      chapterNumber,
      folderURL,
    });

    const file = allFiles.find((file) => {
      const match = file.name.match(/(\d+)/);
      return match && parseInt(match[1]) === pageNumber;
    });

    if (!file) throw new Error(`Page number "${pageNumber}" not found`);

    const filePath = path.join(DOWNLOAD_DIR, `${fileName}.png`);

    if (fs.existsSync(filePath)) return filePath;

    const destStream = fs.createWriteStream(filePath);
    const tempPath = `${filePath}.tmp`;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      };

      this.drive.files.get(
        { fileId: file.id, alt: "media" },
        { responseType: "stream" },
        (err, res) => {
          if (err) {
            cleanup();
            return reject(new Error(`Failed to download file: ${err.message}`));
          }

          if (!res?.data) {
            cleanup();
            return reject(new Error("No data received from Google Drive"));
          }

          res.data
            .on("error", (error) => {
              cleanup();
              reject(new Error(`Stream error: ${error.message}`));
            })
            .pipe(destStream)
            .on("error", (error) => {
              cleanup();
              reject(new Error(`Write error: ${error.message}`));
            })
            .on("finish", () => {
              try {
                fs.renameSync(tempPath, filePath);
                resolve(filePath);
              } catch (error) {
                cleanup();
                reject(new Error(`Failed to rename file: ${error.message}`));
              }
            });
        }
      );
    });
  }

  // Helpers

  /**
   * Extracts page number from a file name
   * @private
   * @param {string} name - File name to extract page number from
   * @returns {number} Extracted page number or 0 if not found
   */
  private getPageNumber(name: string): number {
    const match = name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Extracts folder ID from a Google Drive folder URL
   * @private
   * @param {string} folderURL - Google Drive folder URL
   * @returns {string | null} Extracted folder ID or null if invalid URL
   */
  private getFolderID(folderURL: string): string | null {
    const match = folderURL.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }
}
