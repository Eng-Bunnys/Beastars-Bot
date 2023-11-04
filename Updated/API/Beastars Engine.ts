/**
 * Beastars Bot Engine
 * Written by .bunnys => 333644367539470337
 * Need help? Support Server: https://discord.gg/yrM7fhgNBW
 * GBF Bot: https://discord.com/api/oauth2/authorize?client_id=795361755223556116&permissions=1642787765494&scope=bot%20applications.commands
 
  Beastars Bot written under GBF

  Engine responsible for holding important functions
*/
import axios, { AxiosError } from "axios";
import fs from "fs";
import * as path from "path";
import { ImgurKey } from "../config/GBFconfig.json";
import MangaGetter from "./Get Manga";
import { ButtonInteraction, CommandInteraction, Message } from "discord.js";

const baseUrl = "https://api.mangadex.org";

interface Chapter {
  id: string;
  type: string;
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: Date;
    readableAt: Date;
    createdAt: Date;
    updatedAt: Date;
    pages: number;
    version: number;
  };
  relationships: Relationship[];
}

interface Relationship {
  id: string;
  type: string;
}

export function getSeriesID(providedSeries: string): string {
  let mangaID: string;
  if (providedSeries === "BST")
    mangaID = "f5e3baad-3cd4-427c-a2ec-ad7d776b370d";
  if (providedSeries === "BC") mangaID = "cd9b65e3-b9e2-4d8b-b9dd-0bc8be59f312";
  if (providedSeries === "OBC")
    mangaID = "5da92b11-42ff-4adc-89b2-072cfd7a12df";
  if (providedSeries === "PG") mangaID = "d1815396-cd66-4459-9cfb-63c32764b864";
  return mangaID;
}

export function getMangaVersion(type?: string) {
  let mangaVersion: string | null;
  if (type && type === "HCS")
    mangaVersion = "97b9cff4-7b84-4fed-929e-1a514be6ca20";
  else if (type && type === "HG")
    mangaVersion = "ca84d695-4e0e-48ba-8627-3cbb4f44f95b";
  else mangaVersion = null;
  return mangaVersion;
}

// For the wiki command
export async function validatePage(query: string): Promise<boolean | string> {
  const url = `https://beastars.fandom.com/wiki/${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    if (response.status === 200) return url;
    else return false;
  } catch (error) {
    return false;
  }
}
// Basic name formatting
export function FormatName(name: string): string {
  const words = name.split(" ");
  const formattedWords = words.map((word) => {
    const trimmedWord = word.replace(/^[^a-zA-Z0-9]+/, "");

    if (trimmedWord.length > 0) {
      const firstChar = trimmedWord.charAt(0);
      const capitalizedWord = firstChar.toUpperCase() + trimmedWord.slice(1);

      return capitalizedWord;
    }

    return "";
  });

  return formattedWords.join(" ");
}
// Returning a readable name for the Beastars manga groups
export function getGroupName(groupId: string): string {
  if (groupId === "97b9cff4-7b84-4fed-929e-1a514be6ca20") return "HCS";
  else if (groupId === "ca84d695-4e0e-48ba-8627-3cbb4f44f95b")
    return "Hybridgumi";
  else return "HCS";
}

type Folder = {
  mimeType: "application/vnd.google-apps.folder";
  id: string;
  name: string;
};

type Data = Chapter | Folder;

function isFolder(obj: Data): obj is Folder {
  return (
    (obj as Folder).mimeType !== undefined &&
    (obj as Folder).mimeType === "application/vnd.google-apps.folder"
  );
}

export function extractChapterNumberFromFolderName(folderName: string): number {
  const chapterMatch = folderName.match(/Ch\.\s([0-9.]+)/i);
  return chapterMatch ? parseFloat(chapterMatch[1]) : null;
}

export function findNextChapterNumber(
  dataArray: Data[],
  currentChapter: number
): number {
  let chapterNumbers: number[] = [];
  dataArray.forEach((item) => {
    let chapterNumber: number = null;
    if (isFolder(item)) {
      chapterNumber = extractChapterNumberFromFolderName(item.name);
    } else {
      chapterNumber = parseFloat((item as Chapter).attributes.chapter);
    }
    if (chapterNumber !== null) {
      chapterNumbers.push(chapterNumber);
    }
  });

  chapterNumbers.sort((a, b) => a - b);

  for (let i = 0; i < chapterNumbers.length; i++) {
    if (chapterNumbers[i] > currentChapter) {
      return chapterNumbers[i];
    }
  }

  return null;
}

// Finding the position of a certain chapter
/**
 * @warning Deprecated | MangaDex Only
 */
export function findChapterInstancesMD(
  chapterNumber: string,
  chapters: Chapter[]
): Chapter[] {
  const instances: Chapter[] = [];
  for (const chapter of chapters) {
    if (chapter.attributes.chapter === chapterNumber) {
      instances.push(chapter);
    }
  }
  return instances;
}

export async function groupSwitchable(
  otherGroup: string,
  message: Message | CommandInteraction | ButtonInteraction,
  page: number,
  chapter: number,
  series: string,
  source: string
): Promise<boolean> {
  if (source !== "MD") {
    const mangaDownloader = new MangaGetter(
      page,
      chapter,
      series,
      source,
      otherGroup,
      false
    );

    const FetchedManga = await mangaDownloader.getPage(message, false, [
      source,
      otherGroup,
      series,
      chapter,
      page,
    ]);

    if (FetchedManga) return true;
    else return false;
  } else {
    const mangaID = getSeriesID(series);
    const allChapters: Chapter[] = await getChapters(mangaID);

    if (findChapterInstancesMD(chapter.toString(), allChapters).length >= 2) {
      return true;
    } else return false;
  }
}

// Getting the type for a chapter
export function getGroupType(
  chapters: Chapter[],
  chapterNumber: string
): [Chapter, string][] {
  const dupedChapters = findChapterInstancesMD(chapterNumber, chapters);

  if (!dupedChapters.length) throw new Error(`This chapter has no groups`);

  let chapterData: [Chapter, string];
  let groupType: string;
  const FinalChapterData = [];

  for (const chapter of chapters) {
    groupType = getGroupName(chapter.relationships[0].id);
    chapterData = [chapter, groupType];
    FinalChapterData.push(chapterData);
  }
  return FinalChapterData;
}
// Getting the position of a chapter
export function getChapterPosition(
  chapters: Chapter[],
  chapterNumber: string,
  next: boolean
): number {
  const index = chapters.findIndex(
    (chapter) => chapter.attributes.chapter === chapterNumber
  );
  if (index !== -1) {
    if (next) {
      return index + 1;
    } else {
      return index;
    }
  }
  return -1;
}
// Getting the next chapter
export function getNextChapter(
  chapters: Chapter[],
  chapterNumber: string
): Chapter | null {
  const position = getChapterPosition(chapters, chapterNumber, true);
  return position !== -1 ? chapters[position] : null;
}
// Getting all of the chapters
export async function getChapters(
  mangaId: string,
  groupId?: string
): Promise<Chapter[]> {
  try {
    const response = await axios({
      method: "GET",
      url: `${baseUrl}/manga/${mangaId}/feed`,
      params: {
        translatedLanguage: ["en"],
        limit: 500,
        contentRating: ["safe", "suggestive"],
      },
    });

    const chapters = (response.data?.data || [])
      .sort(
        (a: any, b: any) =>
          parseFloat(a.attributes.chapter) - parseFloat(b.attributes.chapter)
      )
      .filter((chapter: Chapter) => {
        return !groupId || chapter.relationships[0]?.id === groupId;
      });

    return chapters;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.log("Chapter not found");
      } else {
        console.log(`Error: ${axiosError.message}`);
      }
    }
    console.error("Failed to fetch manga chapters: ", error);
    throw error;
  }
}

export async function downloadImageByIndex(
  chapterId: string,
  index: number,
  quality: string,
  savePath: string
): Promise<{
  message: string;
  maxFiles: number;
  filePath?: string;
  chapterURL?: string;
}> {
  try {
    const response = await axios.get(`${baseUrl}/at-home/server/${chapterId}`);
    const serverUrl = response.data.baseUrl;
    const chapterHash = response.data.chapter.hash;
    const filenames = response.data.chapter[quality];

    const chapterBaseURL = `https://mangadex.org/chapter/${chapterId}/${
      index + 1
    }`;

    fs.mkdirSync(savePath, { recursive: true });

    if (index >= 0 && index < filenames.length) {
      const filename = filenames[index];
      const imageUrl = `${serverUrl}/${quality}/${chapterHash}/${filename}`;

      const filePath = path.join(savePath, filename);

      if (fs.existsSync(filePath)) {
        return {
          message: `Page ${index + 1}/${filenames.length}`,
          filePath,
          chapterURL: chapterBaseURL,
          maxFiles: filenames.length,
        };
      }

      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      fs.writeFileSync(filePath, new Uint8Array(imageResponse.data), {
        flag: "w",
      });

      return {
        message: `Page ${index + 1}/${filenames.length}`,
        filePath,
        chapterURL: chapterBaseURL,
        maxFiles: filenames.length,
      };
    } else {
      const maxIndex = filenames.length - 1;
      const filename = filenames[maxIndex];
      const filePath = path.join(savePath, filename);

      return {
        message: `Page ${maxIndex + 1}/${filenames.length}`,
        filePath,
        chapterURL: chapterBaseURL,
        maxFiles: filenames.length,
      };
    }
  } catch (error) {
    console.error("Failed to download image:", error);
    throw error;
  }
}

export async function getRandomPhotoFromAlbum(
  albumId: string
): Promise<string> {
  const response = await fetch(
    `https://api.imgur.com/3/album/${albumId}/images`,
    {
      headers: {
        Authorization: `Client-ID ${ImgurKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch photos from Imgur album");
  }

  const albumData = await response.json();
  const photos = albumData.data;

  if (!photos || photos.length === 0) {
    throw new Error("No photos found in Imgur album");
  }

  const randomIndex = Math.floor(Math.random() * photos.length);
  const randomPhoto = photos[randomIndex].link;

  return randomPhoto;
}

export function getImgurIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    const pathSegments = pathname.split("/");
    const idSegment = pathSegments[pathSegments.length - 1];

    const id = idSegment.split("?")[0];

    return id || null;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

export function isValidImgurUrl(url: string): boolean {
  const imgurRegex =
    /^(?:https?:\/\/)?(?:i\.)?(?:m\.)?(?:imgur\.com\/)(?:gallery\/)?([a-zA-Z0-9]{5,7})/;
  return imgurRegex.test(url);
}

export function getFolderId(folderLink: string): string | null {
  const match = folderLink.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export function readableGroup(group: string): string {
  if (group === "HCS") return "HCS";
  if (group === "HG") return "Hybridgumi";
}
