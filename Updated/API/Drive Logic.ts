/**
 * Drive Logic
 * Written by .bunnys => 333644367539470337
 * Need help? Support Server: https://discord.gg/yrM7fhgNBW
 * GBF Bot: https://discord.com/api/oauth2/authorize?client_id=795361755223556116&permissions=1642787765494&scope=bot%20applications.commands
 
  Beastars Bot written under GBF

  Contains all of the logic for getting data from Google Drive and handling it
*/

import { google } from "googleapis";
import { DriveKey } from "../config/GBFconfig.json";
import path from "path";
import fs from "fs";

export async function downloadPage(
  chapterNumber: number,
  pageNumber: number,
  fileName: string,
  folderURL: string
): Promise<string> {
  const allFiles = await getFilesFromChapter(chapterNumber, folderURL);

  const file = allFiles.find((file: any) => {
    const match = file.name.match(/(\d+)/);
    return match && parseInt(match[1]) === pageNumber;
  });

  if (!file) throw new Error(`Page ${pageNumber} does not exist`);

  const filePath = path.join("drive", `${fileName}.png`);

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    // If file exists, return the file path
    return filePath;
  }

  // If file does not exist, download the file
  const authClient = new google.auth.OAuth2();
  authClient.apiKey = DriveKey;

  const drive = google.drive({
    version: "v3",
    auth: authClient
  });

  const destStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" },
      (err, res) => {
        if (err) reject(err);

        res.data
          .on("error", reject)
          .pipe(destStream)
          .on("error", reject)
          .on("finish", () => resolve(filePath));
      }
    );
  });
}

export async function getFilesFromChapter(
  chapterNumber: number,
  folderURL: string
): Promise<any[]> {
  const chapterFolders = await getFolders(folderURL);

  // Filter out the folder for the specific chapter
  const chapterFolder = chapterFolders?.find((folder: any) =>
    // Allows for zero or more occurrences of the prefix "0",
    // not followed by a dot and any digit
    new RegExp(`^Ch\. 0*${chapterNumber}(?![\\.\\d])`).test(folder.name)
  );

  if (chapterFolder) {
    const authClient = new google.auth.OAuth2();
    authClient.apiKey = DriveKey;

    const drive = google.drive({
      version: "v3",
      auth: authClient
    });

    try {
      const res = await drive.files.list({
        q: `'${chapterFolder.id}' in parents and trashed=false`,
        fields: "nextPageToken, files(id, name, mimeType, size)",
        pageSize: 1000
      });
      const imageMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/webp"
      ];

      const imageFiles = (res.data.files || []).filter((file) =>
        imageMimeTypes.includes(file.mimeType)
      );

      // Sorting image files based on its numeric representation in the name
      imageFiles.sort((a, b) => {
        const pageNumberA = extractPageNumber(a.name);
        const pageNumberB = extractPageNumber(b.name);

        return pageNumberA - pageNumberB;
      });

      return imageFiles;
    } catch (error) {
      throw new Error(`Google Drive Error [Files]: ${error}`);
    }
  } else {
    throw new Error(`Folder for Chapter ${chapterNumber} not found.`);
  }
}

export function getFolderId(folderLink: string): string | null {
  const match = folderLink.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export async function getFolders(folderURL: string): Promise<any[]> {
  const authClient = new google.auth.OAuth2();
  authClient.apiKey = DriveKey;

  const drive = google.drive({
    version: "v3",
    auth: authClient
  });

  const folderRegex = /Ch\. (\d+)(?: Vol\. \d+)?/;
  const folderId = getFolderId(folderURL);

  try {
    let res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageSize: 1000
    });

    let folders = res.data.files?.filter(
      (file: any) => file.mimeType === "application/vnd.google-apps.folder"
    );

    // filter folders with names with "Ch..."
    let chapterFolders = folders?.filter((folder: any) =>
      folderRegex.test(folder.name)
    );

    // sort folders by chapter number
    chapterFolders = chapterFolders?.sort((a: any, b: any) => {
      let matchA = a.name.match(folderRegex);
      let matchB = b.name.match(folderRegex);

      let chapterNumA = matchA ? parseInt(matchA[1]) : 0;
      let chapterNumB = matchB ? parseInt(matchB[1]) : 0;

      return chapterNumA - chapterNumB;
    });

    return chapterFolders;
  } catch (error) {
    throw new Error(`Google Drive Error [Folders]: ${error}`);
  }
}

function extractPageNumber(name: string): number {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
