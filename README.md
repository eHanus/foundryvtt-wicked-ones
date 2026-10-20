<p align="center"><img src="readme-images/WWfoundry.png"></img></p>

# Wicked Ones Game System for Foundry VTT
### For questions or reporting bugs contact us on Discord: `eiktopus` or `LorduFreeman#8747`.

> **Version 1.2.0 Update:** The system is now fully updated and verified for **Foundry VTT v14** (compatible with v13–v14) and includes automated world migration for existing v10–v12 campaigns, and an in-game **Interface & Sheet Guide** journal!

Since the original Wicked Ones site has been discontinued, you can currently obtain the game at these sites:
- An unaffiliated page on itch.io (https://boxman214.itch.io/wicked-ones-ttrpg)
- A GitHub repository holding the files of the original Wicked Ones title now under CC0 (https://github.com/chuckdee68/WickedOnes).

Based on the great Blades in the Dark FoundryVTT system by `megastruktur`.

#### Scroll down for pretty pictures, yeeeees.

## Install
### Using the Manifest
- Copy the following URL: `https://github.com/eHanus/foundryvtt-wicked-ones/releases/latest/download/system.json`
- Paste it into the **Manifest URL** field in the Install System dialog in your Foundry app.

### Using Foundry System Browser
Navigate to the **Wicked Ones** system in the Foundry VTT Setup browser and hit install!

---

## Features & Usage

### Included Actor Sheets
The system contains bespoke, custom-styled sheets for both the core **Wicked Ones** game and the **Undead Awakening** expansion:
- **Player Characters (Wicked Ones, Awakened & Primal Monsters):** Supports standard Callings, Undead Awakened types (automatically swapping *Banter/Threaten* for *Horrify/Command* and hiding Gold), and full custom interfaces for **Primal Monsters** (*Braineater* Psionic Disciplines, interactive *Doomseeker* Eye-Ray image maps, *Facestealer* Stolen Faces, and *Goldmonger* Growth Paths & Size trackers).
- **Minion Packs:** Supports both standard **Minion Packs** and Undead Awakening **Zombie Packs**.
- **Dungeons:** Track your Dungeon Theme, Sanctum mechanic, Tier (`0–4`), Tier-3 Rooms (with automatic Theme Flexibility highlighting), Dungeon Description, and 6-step Master Plan.
- **Adventurer Parties:** Manage invading Adventurers and Hirelings (with built-in random class/trait/motivation generators), cycle through 3-state Heart damage slashes, and roll Defensive Moves directly via the shield icon.
- **Factions & Factions (UA):** Track Faction tiers, categories, and clocks—with automatic canvas token artwork syncing when a Faction's tier or alignment changes.
- **GM Sheets &GM Sheets (UA):** Dedicated GM dashboard sheets for tracking the active **Phase of Play** (with localized rules prompts), Calamities, Blowback, and campaign notes.
- **Conquest Sheet (UA):** Manage the Undead Awakening Conquest map, adjustable Conquest Candle, Domain states (*Horde*, *Horror*, *Corruption*), and Conquest Abilities.
- **Clocks (`⏰ Clock`):** Create standalone progress clocks (`4`, `6`, `8`, or `12` segments) and drag them onto the canvas as tokens whose artwork stays synced with the sheet.

### Compendia & In-Game Interface Guide
All official items and content from the rulebooks—including Adventurers, Awakened Types, Callings, Conquest Abilities, Defenses, Downtime Projects, Dungeon Duties, Tier-3 Rooms, Dungeon Themes, Gear & Supply, Goldmonger Types, Major Invasions, Impulses, Minion Types & Upgrades, Monster Races, Revelries, and Special Abilities—are included in the system compendia and can be customized on the fly.

When you create a new world, a multi-page **Wicked Ones — Interface & Sheet Guide** Journal Entry is automatically imported into your Journal sidebar (and is always available in the `System Documentation` compendium) to help players and GMs learn every sheet shortcut.

### Quick Interface Tips
- **Adding Items (`+` Icon):** Hover over any brown section header bar (or labels like *Calling*, *Monster Race*, or *Revelry*) and click the **`+` button** that fades into view to open a filtered item picker. Dragging and dropping from a Compendium works as well.
- **Resetting Trackers (Hidden Red Dot / `0`):** Hover just to the **left** of the first square/tooth/dot on any skill, XP, Gold, or Move tracker (or top-left of a clock) to reveal a **red reset dot** or **`0` icon** that clears the bar back to zero.
- **Editing & Deleting Items:** Click any added item's **bold title** to open its editor sheet. Hover over an item row to reveal a **trash can icon** on the right to delete it.
- **Tooltips & Light Tongue Reference:** Many elements display rules tooltips when hovered over. On a Player Character's **Notes** tab, hover over the **speech-bubble icon** next to `NOTES` to pop up the 20-word **Light Tongue** reference grid!
- **Shared Supply Sync:** Marking uses on a **Shared** supply item automatically synchronizes the remaining uses across all Player Character sheets in the world.
- **Shocked Penalty:** Clicking the diamond next to an Attribute header toggles **Shocked**, automatically applying a `-1d` modifier to rolls for that attribute.
- **Practice XP:** Click the vertical double-diamond icon next to an Attribute header to cycle through Practice XP slashes (`0` → `1` → `2`) on the first skill box.
- **Action & Resistance Rolls:** Click any **Skill Name** or **Attribute Header** on a sheet to open the Skill Roll dialog.
- **General / GM Dice Roller:** Click the **Dice icon** at the bottom of the left-hand Scene Controls toolbar to open the multi-roller for Fortune, Engagement, Starting Location, Pathing, Loot, Slumber, or raw dice pools.

#### Translation
The system can be translated—see the `lang/en.json` file, create your own version (for example `de.json` for German), and reach out if you want to get your language included. Do not hesitate to ask us for help if you want to translate the game into your language!

#### Player Permissions
If you want players to have freedom to create their own custom items from scratch, changing their role to Trusted Player or setting custom item creation permissions is advised. By default, standard Player permissions are sufficient to create characters and add/edit all items on their owned sheets.

#### Additional Assets
Getting the official Wicked Ones assets pack is highly recommended if you want to use the Sandbox Maps (like the one shown below) or monster tokens!

---

## Screenshots of the System
*(Click for full size)*

### Wicked One and Minion Sheet
Items or abilities are added by clicking the **+** icon appearing on hover; deleting is done by clicking the trash bin appearing on hover. Dragging and dropping from a Compendium works as well. **Red dots** appearing on mouse-over or `(0)` for clocks are used to **reset skill bars or clocks**. **Practice XP** is shown by a slash or cross in the first skill square. Many elements display **tooltips** after **hovering over them** for a moment.
![Main Sheets](readme-images/wominionscompendia.png)

### Adventurers, Dungeons and Clocks Sheets
![Adventurers, Dungeons and Clocks Sheets](readme-images/othersheets.png)

### Example World Map with Faction Markers
Tiers are shown by the inner spikes of their tokens; alignment is shown by their color. **Drag and drop** a created Faction onto the scene to place a synced banner token for them.
![Example World Map](readme-images/factions.png)

### Example Rolls and Custom "Claw Marks" Dice (with the Dice So Nice! Module)
All proper rolls show their outcome right in the chat (and you can **click the result to toggle descriptions**, with an optional default-to-hidden **toggle available in the System Settings!**). If you use **Dice So Nice!**, you have the choice of **four custom Wicked Ones sets**: Dots (white or dark), Claw Marks, or classic numbers, with dots being the default.
![Rolls and Dice](readme-images/dice.png)

### Roller Pop-Ups: Multi-Roller (Left) and Skill-Roller (Right)
The **Skill-Roller** pops up on **clicking skills on the sheets** and adjusts dynamically to selected options. The **Multi-Roller** (dice button in the left-hand scene controls toolbar) contains all the other rolls the GM and players need for Engagement, Dungeon Defense, Loot, and other purposes.
![Popups](readme-images/rollers.png)

### Editable Item Windows
**Every item entry is clickable and customizable** (both in title and description)! Enter your own descriptions and customize your world.
![Editable items](readme-images/items.png)

---

## Module Recommendations
- **Dice So Nice!** to use the custom 3D dice included with this system.
- **Chat Images** — always nice to be able to post or drag inspirational images into the chat when world-building.
- **Drag Upload** — great for populating the map quickly with tokens that do not need full actor stats (e.g., Monster or Human Camps).

**Disclaimer**: Always check module compatibility with your current Foundry VTT version.

## Future Ideas & Roadmap
- Future migration of sheets from Foundry's `AppV1` compatibility layer to `ApplicationV2` ahead of Foundry VTT v16
- Explore the possible addition of context menus
- Ability to drag skills into the macro hotbar for quick access
- Quality-of-life improvements and bugfixes based on community feedback

## Troubleshooting
- **Missing Drag-and-Dropped Item:** If you cannot find an item you dragged onto a sheet, check the **"All"** tab on that sheet (it may be filtered out if it belongs to a different character/pack type).

## Credits
- This work is based on *Wicked Ones* by Ben Nielson and Victor Costa—a huge **Thank You!** to both of them for letting us use the wonderful official written and graphical content from the book to build this system!
- *Wicked Ones* is based on *Blades in the Dark* (Forged in the Dark License) (found at http://www.bladesinthedark.com/), a product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).