// main.js (CommonJS version)
// An example Obsidian plugin that registers a custom "LUW" format token in moment.js.
// You can then use "LUW" in your Daily Note plugin's date format, for instance:
//     [Week] LUW MMM Do YYYY
// This will display "Week 3 Jan 12th 2025" or "VACATION Jan 12th 2025" if not in a defined week range.

const { Plugin, requestUrl } = require("obsidian");

// Save this for unloading the plugin
const originalFormat = window.moment.fn.format;

// ICS calendar URL
const ICS_URL = "https://lusiservice.lancs.ac.uk/iCalendar/LancasterWeeks.ics";
const TARGET_YEAR = "25/26";

// Define date ranges for Lancaster University terms
// These will be populated dynamically from the ICS feed
let luWeekBlocks = [
  // 2025/26 Academic Year (defaults, will be updated from ICS)
  { start: "2025-10-06", end: "2025-12-14", startWeek: 1, endWeek: 10 }, // Michaelmas term
  { start: "2026-01-12", end: "2026-03-22", startWeek: 11, endWeek: 20 }, // Lent term
  { start: "2026-04-27", end: "2026-06-28", startWeek: 22, endWeek: 30 }, // Summer term
];

/**
 * Parses ICS data to extract events for the target academic year
 */
function parseICS(icsData) {
  const events = [];
  const lines = icsData.split("\n");
  let currentEvent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
    } else if (line === "END:VEVENT" && currentEvent) {
      if (
        currentEvent.description &&
        currentEvent.description.includes(TARGET_YEAR)
      ) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith("DESCRIPTION:")) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith("DTSTART;VALUE=DATE:")) {
        currentEvent.startDate = line.substring(19);
      } else if (line.startsWith("DTEND;VALUE=DATE:")) {
        currentEvent.endDate = line.substring(17);
      }
    }
  }

  return events;
}

/**
 * Formats a date string from YYYYMMDD to YYYY-MM-DD
 */
function formatDate(dateStr) {
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr;
}

/**
 * Groups events by term and filters for term weeks only
 */
function organizeByTerm(events) {
  const terms = {
    michaelmas: [],
    lent: [],
    summer: [],
  };

  events.forEach((event) => {
    const desc = event.description || "";

    if (desc.includes("Michaelmas Term")) {
      terms.michaelmas.push(event);
    } else if (desc.includes("Lent Term")) {
      terms.lent.push(event);
    } else if (desc.includes("Summer Term")) {
      terms.summer.push(event);
    }
  });

  return terms;
}

/**
 * Extracts week number from event description
 */
function getWeekNumber(event) {
  const match = event.description.match(/Wk (\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Fetches and updates luWeekBlocks from ICS calendar
 */
async function updateWeekBlocksFromICS() {
  try {
    const response = await requestUrl({ url: ICS_URL });
    const icsData = response.text;

    const events = parseICS(icsData);
    const terms = organizeByTerm(events);

    const newBlocks = [];

    // Michaelmas Term
    const michWeeks = terms.michaelmas
      .filter((e) => getWeekNumber(e) !== null)
      .sort((a, b) => getWeekNumber(a) - getWeekNumber(b));
    if (michWeeks.length > 0) {
      newBlocks.push({
        start: formatDate(michWeeks[0].startDate),
        end: formatDate(michWeeks[michWeeks.length - 1].endDate),
        startWeek: getWeekNumber(michWeeks[0]),
        endWeek: getWeekNumber(michWeeks[michWeeks.length - 1]),
      });
    }

    // Lent Term
    const lentWeeks = terms.lent
      .filter((e) => getWeekNumber(e) !== null)
      .sort((a, b) => getWeekNumber(a) - getWeekNumber(b));
    if (lentWeeks.length > 0) {
      newBlocks.push({
        start: formatDate(lentWeeks[0].startDate),
        end: formatDate(lentWeeks[lentWeeks.length - 1].endDate),
        startWeek: getWeekNumber(lentWeeks[0]),
        endWeek: getWeekNumber(lentWeeks[lentWeeks.length - 1]),
      });
    }

    // Summer Term
    const summerWeeks = terms.summer
      .filter((e) => getWeekNumber(e) !== null)
      .sort((a, b) => getWeekNumber(a) - getWeekNumber(b));
    if (summerWeeks.length > 0) {
      newBlocks.push({
        start: formatDate(summerWeeks[0].startDate),
        end: formatDate(summerWeeks[summerWeeks.length - 1].endDate),
        startWeek: getWeekNumber(summerWeeks[0]),
        endWeek: getWeekNumber(summerWeeks[summerWeeks.length - 1]),
      });
    }

    if (newBlocks.length > 0) {
      luWeekBlocks = newBlocks;
      console.log("LU Week blocks updated from ICS calendar:", luWeekBlocks);
    }

    return true;
  } catch (error) {
    console.error("Failed to fetch ICS calendar, using default dates:", error);
    return false;
  }
}

// We declare our custom moment function to add TypeScript-like hints inline
// (not strictly necessary in pure CommonJS; just clarifies usage).
// When used in Obsidian, this helps define a new "luWeek()" method.
const enhanceMomentWithLUWeek = () => {
  // If luWeek() is not already defined, we add it
  if (!window.moment.prototype.luWeek) {
    window.moment.prototype.luWeek = function () {
      const currentDate = this.clone().startOf("day");
      for (const block of luWeekBlocks) {
        const startDate = window
          .moment(block.start, "YYYY-MM-DD")
          .startOf("day");
        const endDate = window.moment(block.end, "YYYY-MM-DD").endOf("day");

        // Check if the current date is within the block range
        if (currentDate.isBetween(startDate, endDate, undefined, "[]")) {
          const daysDiff = currentDate.diff(startDate, "days");
          const weekOffset = Math.floor(daysDiff / 7);
          const computedWeek = block.startWeek + weekOffset;

          return computedWeek <= block.endWeek
            ? `Week ${computedWeek}`
            : "VACATION";
        }
      }
      return "VACATION";
    };
  }

  // Patch moment's format() to replace "LUW" with the output of luWeek()
  // We do this only once, indicated by a custom flag _luwInjected.
  if (!window.moment.prototype._luwInjected) {
    window.moment.prototype.format = function (formatStr) {
      if (!formatStr) {
        return originalFormat.call(this, formatStr);
      }
      if (formatStr.includes("LUW")) {
        const luValue = this.luWeek(); // "Week 3" or "VACATION"
        formatStr = formatStr.replace(/LUW/g, "[" + luValue + "]");
      }
      return originalFormat.call(this, formatStr);
    };
    window.moment.prototype._luwInjected = true;
  }
};

module.exports = class LUWeekFormatTokenPlugin extends Plugin {
  async onload() {
    // Fetch and update week blocks from ICS calendar
    await updateWeekBlocksFromICS();

    // Enhance the global moment with our custom LUWeek logic
    enhanceMomentWithLUWeek();
    console.log("LUWeekFormatTokenPlugin (CommonJS) loaded!");
  }

  onunload() {
    if (window.moment.prototype._luwInjected) {
      window.moment.prototype.format = originalFormat;

      delete window.moment.prototype._luwInjected;
      delete window.moment.prototype.luWeek;
    }

    console.log("LUWeekFormatTokenPlugin (CommonJS) unloaded.");
  }
};
