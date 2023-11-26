import {
  BaseMessageOptions,
  CommandInteraction,
  DMChannel,
  Guild,
  GuildChannel,
  Interaction,
  Message,
  PermissionResolvable,
  Snowflake,
  TextBasedChannel,
  TextChannel
} from "discord.js";

import fs from "fs";
import path from "path";

import { PermissionFlagsBits, ChannelType, GuildMember } from "discord.js";

/**
 * Delay the execution of the next instruction by a specified number of milliseconds.
 *
 * @param ms - The number of milliseconds to delay the execution.
 * @returns A Promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**

Converts a number of milliseconds into a string representation of time with
units of varying granularity.
 * @param {number} time - The time in milliseconds.
 * @param {object} [options] - Optional configuration options.
 * @param {string} [options.format='long'] - The format of the output string ('short' or 'long').
 * @param {boolean} [options.spaces=false] - Whether to include spaces in the output string.
 * @param {string} [options.joinString=' '] - The string to use for joining time units.
 * @param {number} [options.unitRounding=100] - The maximum number of time units to include in the output string.
 * @returns {string|undefined} The human-readable duration string, or undefined if the time is not a number or is negative.
@example
// Returns "1 hour 30 minutes"
msToTime(5400000);
@example
// Returns "2d 3h 45m"
msToTime(189000000, { format: 'short', spaces: true, joinString: ' ', unitRounding: 3 });
*/

interface Options {
  format?: "long" | "short";
  spaces?: boolean;
  joinString?: string;
  unitRounding?: number;
}

export function msToTime(
  time: number,
  options: Options = {}
): string | undefined {
  const defaultOptions: Options = {
    format: "long",
    spaces: false,
    joinString: " ",
    unitRounding: 100
  };

  options = Object.assign({}, defaultOptions, options);

  let timeStr = "";
  let nr = 0;

  if (typeof time !== "number" || time < 0) {
    return undefined;
  }

  for (let i = Object.keys(timeUnitValues).length - 1; i >= 0; i--) {
    let key = Object.keys(timeUnitValues)[i];
    if (key === "a") continue;

    let ctime = time / timeUnitValues[key];
    if (ctime >= 1) {
      if ((options.unitRounding || 100) < ++nr) break;

      ctime = Math.floor(ctime);
      timeStr += `${ctime} ${fullTimeUnitNames[key][options.format]}${
        ctime !== 1 && options.format !== "short" ? "s" : ""
      }${options.spaces ? " " : options.joinString}`;
      time -= ctime * timeUnitValues[key];
    }
  }

  timeStr = timeStr.trim();
  if (timeStr === "") return undefined;
  return timeStr;
}

/**

Returns a string indicating the missing permissions of a target member, compared to the required permissions.
@param {GuildMember} targetMember - The target member to check the permissions of.
@param {PermissionResolvable | PermissionResolvable[]} requiredPermissions - The required permissions to check against.
@returns {string} - A string indicating the missing permissions, formatted with backticks for each missing permission.
If there is more than one missing permission, it will include "and n more" at the end of the list, where n is the number of additional missing permissions.
@throws {TypeError} - If the targetMember parameter is not a GuildMember or if the requiredPermissions parameter is not a PermissionResolvable.
@throws {RangeError} - If the requiredPermissions parameter is an empty array.
@example
// Returns "Manage Roles and Ban Members"
const targetMember = interaction.guild.members.cache.get('365647018393206785'); // Ace ID
const requiredPermissions = ['MANAGE_ROLES', 'BAN_MEMBERS'];
const missingPerms = missingPermissions(targetMember, requiredPermissions);
console.log(missingPerms);
*/

export function missingPermissions(targetMember, requiredPermissions) {
  if (!targetMember || !(targetMember instanceof GuildMember))
    return "Specificed user is not a GuildMember";

  const missingPerms = targetMember.permissions
    .missing(requiredPermissions)
    .map(
      (str) =>
        `\`${str
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b(\w)/g, (char) => char.toUpperCase())}\``
    );

  return missingPerms;
}

/**
 * Capitalizes the first letter of a string.
 * @param string - The string to capitalize the first letter of.
 * @returns The input string with the first letter capitalized.
 * If the input string is empty or undefined, an error message is returned.
 * @example
 * capitalizeFirstLetter("hello world"); // "Hello world"
 * capitalizeFirstLetter("jOHN"); // "JOHN"
 * capitalizeFirstLetter(""); // "Error: Input string is empty or undefined."
 * capitalizeFirstLetter(); // "Error: Input string is empty or undefined."
 */
export function capitalizeFirstLetter(string?: string): string {
  if (!string || !string.trim().length) {
    return "Error: Input string is empty or undefined.";
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Takes a string and lowercases it then uppercase the first word of each sentence you could say
 * @param {string}  word - The word to be like Custom Status instead of just CUSTOM STATUS
 * @returns {string} - Returns a beautified converted string
 * @example capitalize(string)
 */

export function capitalize(str: string): string {
  return str.replace(/(?<=\W)(\w)/g, (char) => char.toUpperCase());
}

/**

Converts a 24-hour format time to a 12-hour format time with AM or PM.
@param {number} hours - The hours of the time in 24-hour format.
@returns {string|undefined} The time in 12-hour format with AM or PM or undefined if input is invalid.
@example
// returns "9:00 AM"
twentyFourToTwelve(9)
@example
// returns "3:00 PM"
twentyFourToTwelve(15)
@example
// "12:00 AM"
twentyFourToTwelve(0)
@example
// return "12:00 PM"
// twentyFourToTwelve(12);
@example
// returns undefined
twentyFourToTwelve(24)
@example
// returns undefined
twentyFourToTwelve(-1)
*/

export function twentyFourToTwelve(hours: number): string {
  if (isNaN(hours) || hours < 0 || hours > 23) return;

  let displayTime: string;

  if (hours < 12) {
    if (hours === 0) {
      displayTime = `12:00 AM`;
    } else {
      displayTime = `${hours.toFixed(0)}:${((hours % 1) * 60)
        .toFixed(0)
        .padStart(2, "0")} AM`;
    }
  } else {
    hours -= 12;
    if (hours === 0) {
      displayTime = `12:00 PM`;
    } else {
      displayTime = `${hours.toFixed(0)}:${((hours % 1) * 60)
        .toFixed(0)
        .padStart(2, "0")} PM`;
    }
  }

  return displayTime;
}

/**
 *
 * @param array [Numbers array that contains the data you want to split]
 * @param size [The maximum number of elements in each array]
 * @returns [[...], [...]]
 */
export function chunkAverage(array: number[], size: number): number[] {
  let renderedChunk: number[];
  let chunkSum = 0;

  const chunkArray = [...array];
  const mainChunk: number[][] = [];
  const averageChunks: number[] = [];

  const backupChunks: number[][] = [];

  const splitIndex = !Number.isNaN(size) ? size : 7;

  while (chunkArray.length > 0) {
    renderedChunk = chunkArray.splice(0, splitIndex);

    if (renderedChunk.length === splitIndex) mainChunk.push(renderedChunk);
    else backupChunks.push(renderedChunk);
  }

  for (let j = 0; j < mainChunk.length || j < backupChunks.length; j++) {
    if (mainChunk.length) {
      chunkSum = mainChunk[j].reduce((partialSum, a) => partialSum + a, 0);
      averageChunks.push(chunkSum);
    } else {
      chunkSum = backupChunks[j].reduce((partialSum, a) => partialSum + a, 0);
      averageChunks.push(chunkSum);
    }
  }
  return averageChunks;
}

/**
 * Attempts to get a guild's general text channel, or any text channel that the bot has permission to send messages to,
 * optionally searching for channels that match the provided name identity.
 * @param guild - The guild to search for the text channel in.
 * @param nameIdentity - Optional. The name-based identity of the text channel to search for.
 * @returns A `TextChannel` if one is found, or `undefined` if none are found.
 */

export function guildChannels(
  guild: Guild,
  NameIdentity = "general" as string
): TextChannel | undefined {
  let channel: TextChannel | undefined;

  if (guild.channels.cache.has(guild.id)) {
    channel = guild.channels.cache.get(guild.id) as TextChannel;

    if (
      channel
        .permissionsFor(guild.client.user)
        ?.has(PermissionFlagsBits.SendMessages)
    ) {
      return channel;
    }
  }

  channel = guild.channels.cache.find(
    (channel) =>
      channel.name.toLowerCase().includes(NameIdentity) &&
      channel.type === ChannelType.GuildText &&
      channel
        .permissionsFor(guild.client.user)
        ?.has(PermissionFlagsBits.SendMessages)
  ) as TextChannel | undefined;

  if (channel) return channel;

  return guild.channels.cache
    .filter(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel
          .permissionsFor(guild.client.user)
          ?.has(PermissionFlagsBits.SendMessages)
    )
    .sort((a: TextChannel, b: TextChannel) => a.position - b.position)
    .first() as TextChannel | undefined;
}

export function removeSpaces(str: string): string {
  return str.replace(/\s/g, "");
}

export function toLowerCaseArray(arr: string[]): string[] {
  return arr.map((elem) => elem.toLowerCase());
}

export function removeSpacesInUrls(folderPath: string): void {
  const files = fs.readdirSync(folderPath);

  files.forEach((fileName) => {
    const filePath = path.join(folderPath, fileName);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonObject = JSON.parse(fileContent);

    if (hasSpacesInUrls(jsonObject)) {
      traverseAndRemoveSpaces(jsonObject);

      const modifiedContent = JSON.stringify(jsonObject, null, 2);
      fs.writeFileSync(filePath, modifiedContent, "utf-8");
      console.log(`Modified: ${fileName}`);
    } else {
      console.log(`No modifications needed: ${fileName}`);
    }
  });
}

function hasSpacesInUrls(data: any): boolean {
  if (typeof data === "object") {
    for (const key in data) {
      if (
        typeof data[key] === "string" &&
        data[key].includes("http") &&
        data[key].includes(" ")
      ) {
        return true;
      } else if (typeof data[key] === "object") {
        if (hasSpacesInUrls(data[key])) {
          return true;
        }
      }
    }
  }
  return false;
}

function traverseAndRemoveSpaces(data: any): void {
  if (typeof data === "object") {
    for (const key in data) {
      if (typeof data[key] === "string" && data[key].includes("http")) {
        data[key] = data[key].replace(/\s/g, "");
      } else if (typeof data[key] === "object") {
        traverseAndRemoveSpaces(data[key]);
      }
    }
  }
}

export async function SendAndDelete(
  Channel: TextBasedChannel,
  MessageOptions: BaseMessageOptions,
  TimeInSeconds = 5
): Promise<Message<false>> {
  if (Channel instanceof DMChannel) return Channel.send(MessageOptions);
  const message: Message | Interaction = await Channel.send(MessageOptions);

  setTimeout(async () => {
    await message.delete();
  }, TimeInSeconds * 1000);
}

export function chooseRandomFromArray<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function getRole(Server: Guild, roleID: string) {
  return Server.roles.cache.get(roleID);
}

type Obj = Record<string, boolean>;

export function stringifyObjects(obj: Obj, text = "true"): string {
  return Object.entries(obj)
    .filter(([key, value]) => value === true)
    .map(([key]) => `${key}: ${text}`)
    .join("\n");
}

export function trimArray<T>(arr: T[], maxLen = 10, type = `role(s)`): T[] {
  if (arr.length > maxLen) {
    const len = arr.length - maxLen;
    arr = arr.slice(0, maxLen);
    arr.push(` and ${len} more ${type}...` as unknown as T);
  }
  return arr;
}

export function checkPermissions(
  interaction: CommandInteraction | Interaction,
  interactionChannel: TextBasedChannel,
  permissions: PermissionResolvable[]
): boolean {
  if (!(interactionChannel instanceof GuildChannel)) {
    throw new Error(
      "Interaction channel is not a guild channel [checkPermissions function error]"
    );
  }
  return interactionChannel
    .permissionsFor(interaction.guild.members.me)
    .has(permissions as PermissionResolvable, true);
}

interface TimeUnits {
  [key: string]: string[];
}

export const timeUnits: TimeUnits = {
  s: ["sec(s)", "second(s)"],
  min: ["minute(s)", "m", "min(s)"],
  h: ["hr(s)", "hour(s)"],
  d: ["day(s)"],
  w: ["wk(s)", "week(s)"],
  mth: ["mth(s)", "month(s)"],
  y: ["year(s)"],
  a: ["julianyear(s)"],
  dec: ["decade(s)"],
  cen: ["cent(s)", "century", "centuries"]
};

interface TimeUnitValues {
  [key: string]: number;
}

const timeUnitValues: TimeUnitValues = {
  s: 1000,
  min: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  mth: 1000 * 60 * 60 * 24 * 30,
  y: 1000 * 60 * 60 * 24 * 365,
  a: 1000 * 60 * 60 * 24 * 365.25,
  dec: 1000 * 60 * 60 * 24 * 365 * 10,
  cen: 1000 * 60 * 60 * 24 * 365 * 100
};

interface TimeUnitNames {
  [key: string]: {
    [key: string]: string;
  };
}

const fullTimeUnitNames: TimeUnitNames = {
  s: {
    short: "s",
    medium: "sec",
    long: "second"
  },
  min: {
    short: "m",
    medium: "min",
    long: "minute"
  },
  h: {
    short: "h",
    medium: "hr",
    long: "hour"
  },
  d: {
    short: "d",
    medium: "day",
    long: "day"
  },
  w: {
    short: "wk",
    medium: "wk",
    long: "week"
  },
  mth: {
    short: "mth",
    medium: "mo",
    long: "month"
  },
  y: {
    short: "y",
    medium: "yr",
    long: "year"
  },
  dec: {
    short: "dec",
    medium: "dec",
    long: "decade"
  },
  cen: {
    short: "cen",
    medium: "cent",
    long: "century"
  }
};
