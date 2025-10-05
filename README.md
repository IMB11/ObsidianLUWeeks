# Lancaster University Week (LUW) Plugin

This plugin extends Obsidian’s built-in Moment.js features to provide a custom date token called **LUW**. When you set your Daily Note (or other Obsidian date formatting options) to include "LUW," it will be replaced with either:

- **Week X** (where X is the numbered Lancaster University week for the 2025/2026 academic year), or
- **VACATION** if the date does not fall within a defined term week.

## Academic Year 2025/2026

The plugin’s logic is currently tailored for the **2025/2026** academic year at Lancaster University. It covers:

- **Michaelmas term**: Weeks 1-10 (6 Oct 2025 to 14 Dec 2025)
- **Lent term**: Weeks 11-20 (12 Jan 2026 to 22 Mar 2026)
- **Summer term**: Weeks 22-30 (27 Apr 2026 to 28 Jun 2026)

Any date outside these date ranges will automatically show "VACATION" in place of "LUW."

> Note: We will update the plugin before the **2026/2027** academic year to maintain accuracy.

## Usage

1. **Install the Plugin**  
   - Copy or clone the plugin files into your Obsidian vault’s plugins folder.  
   - Alternatively you can download it from the Community Plugin Browser.
   - Ensure that you have enabled it in Obsidian’s "Community Plugins" section.

2. **Set Your Daily Note Date Format**  
   - Go to Obsidian’s "Settings" → "Core Plugins" → "Daily Notes."  
   - In the **Date Format** field, include `LUW`.  
   - Example: `LUW MMM Do YYYY`

3. **Verify the Output**  
   - Create a new daily note or check your daily note for a date within the defined ranges.  
   - Confirm that "LUW" is replaced with the correct "Week X" or "VACATION."

## License

This plugin is provided under the CC-0 License. See [LICENSE](./LICENSE) for more details.
