import axios from "axios";

const WIKI_BASE_URL = `https://beastars.fandom.com/wiki/`;

export class BeastarsWiki {
  private readonly query: string;

  constructor(query: string) {
    if (!query || typeof query !== "string" || query.trim().length === 0)
      throw new Error("Query must be a non-empty string");

    this.query = query.trim();
  }

  public async search(): Promise<string | null> {
    try {
      const url = WIKI_BASE_URL + encodeURIComponent(this.query.toLowerCase());

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        validateStatus: (status) => status < 500,
      });

      // If the page exists (200) or redirects (301/302), return the URL
      if (
        response.status === 200 ||
        response.status === 301 ||
        response.status === 302
      )
        return url;

      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) return null;

        throw new Error(`Wiki search failed: ${error.message}`);
      }
      throw new Error(
        `Unexpected error during wiki search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
