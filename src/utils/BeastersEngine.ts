import axios, { AxiosResponse } from "axios";
import fs from "fs";
import path from "path";

const baseUrl = "https://api.mangadex.org";

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

export function getNextChapter(
  chapters: Chapter[],
  chapterNumber: string
): Chapter | null {
  const position = getChapterPosition(chapters, chapterNumber, true);
  return position !== -1 ? chapters[position] : null;
}

export async function getChapters(
  mangaId: string,
  type: number
): Promise<Chapter[]> {
  try {
    const baseUrl = "https://api.mangadex.org";

    const response = await axios({
      method: "GET",
      url: `${baseUrl}/manga/${mangaId}/feed`,
      params: {
        translatedLanguage: ["en"],
        limit: 500
      }
    });

    const chapters =
      response.data?.data
        .filter((chapter: any) => {
          if (type === 1) return chapter.attributes.version === type;
          else return true;
        })
        .sort(
          (a: any, b: any) =>
            parseInt(a.attributes.chapter) - parseInt(b.attributes.chapter)
        ) || [];

    return chapters;
  } catch (error) {
    console.error("Failed to fetch manga chapters:", error);
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
          maxFiles: filenames.length
        };
      }

      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      fs.writeFileSync(filePath, new Uint8Array(imageResponse.data), {
        flag: "w"
      });

      return {
        message: `Page ${index + 1}/${filenames.length}`,
        filePath,
        chapterURL: chapterBaseURL,
        maxFiles: filenames.length
      };
    } else {
      throw new Error(`Image index out of range [${filenames.length} pages]`);
    }
  } catch (error) {
    console.error("Failed to download image:", error);
    throw error;
  }
}
