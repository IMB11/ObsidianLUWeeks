// main.js (CommonJS version)
// An example Obsidian plugin that registers a custom "LUW" format token in moment.js.
// You can then use "LUW" in your Daily Note plugin's date format, for instance: 
//     [Week] LUW MMM Do YYYY
// This will display "Week 3 Jan 12th 2025" or "VACATION Jan 12th 2025" if not in a defined week range.

const { Plugin } = require("obsidian");

// Define date ranges for Lancaster University terms
const luWeekBlocks = [
  // 2024/25 Academic Year
  { start: "2024-10-04", end: "2024-12-13", startWeek: 1,  endWeek: 10 },  // Michaelmas term
  { start: "2025-01-10", end: "2025-03-21", startWeek: 11, endWeek: 20 },  // Lent term
  { start: "2025-03-24", end: "2025-03-28", startWeek: 21, endWeek: 21 },  // Summer term (Week 1)
  { start: "2025-04-28", end: "2025-06-27", startWeek: 22, endWeek: 30 },  // Summer term (Week 2 onwards)
];

// We declare our custom moment function to add TypeScript-like hints inline
// (not strictly necessary in pure CommonJS; just clarifies usage).
// When used in Obsidian, this helps define a new "luWeek()" method.
const enhanceMomentWithLUWeek = () => {
  // If luWeek() is not already defined, we add it
  if (!window.moment.prototype.luWeek) {
    window.moment.prototype.luWeek = function () {
      const currentDate = this.clone().startOf("day");
      for (const block of luWeekBlocks) {
        const startDate = window.moment(block.start, "YYYY-MM-DD").startOf("day");
        const endDate   = window.moment(block.end,   "YYYY-MM-DD").endOf("day");

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
    const originalFormat = window.moment.fn.format;
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
    // Enhance the global moment with our custom LUWeek logic
    enhanceMomentWithLUWeek();
    console.log("LUWeekFormatTokenPlugin (CommonJS) loaded!");
  }

  onunload() {
    console.log("LUWeekFormatTokenPlugin (CommonJS) unloaded.");
  }
};