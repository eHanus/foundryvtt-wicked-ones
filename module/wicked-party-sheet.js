import { WickedSheet } from "./wicked-sheet.js";
import { WickedHelpers } from "./wicked-helpers.js";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * @extends {WickedSheet}
 */
export class WickedPartySheet extends WickedSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "actor"],
      template: "systems/wicked-ones/templates/party-sheet.html",
      width: 830,
      height: 620,
      tabs: []
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const sheetData = await super.getData(options);
    sheetData.editable = this.options.editable;

    sheetData.actor = sheetData.data;
    sheetData.system = sheetData.document.system; // project system data so that handlebars has the same name and value paths
    sheetData.notes = await TextEditor.enrichHTML(this.object.system.description ?? "", {
      relativeTo: this.object,
      secrets: this.object.isOwner
    });

    // Override Code for updating the sheet goes here
    let max_tier = 0;
    let adventurers = [];
    let hirelings = [];

    sheetData.items.forEach(e => {
      if (e.type == "adventurer" && e.system.adventurer_type == "adventurer") {
        if ((e.system.tier) > max_tier) {
          max_tier = e.system.tier;
        }
      }
    });

    sheetData.items.forEach(e => {
      if (e.type == "adventurer" && e.system.adventurer_type == "adventurer") {
        let hearts = [];
        let slashes_left = e.system.heart_slashes ?? 0;
        for (var i = 5; i > 0; i--) {
          if (i > max_tier + 1) {
            hearts[i] = "hidden";
          } else if (i > e.system.tier + 1) {
            hearts[i] = "greyed";
          } else {
            // Distribute slashes
            if (slashes_left > 1) {
              hearts[i] = "slashed-2";
              slashes_left -= 2;
            } else if (slashes_left == 1) {
              hearts[i] = "slashed-1";
              slashes_left = 0;
            } else {
              hearts[i] = "";
            }
          }
        }
        let adventurer = e;
        adventurer.system.hearts = hearts;
        adventurers.push(adventurer);
      }
    });

    sheetData.items.forEach(e => {
      if (e.type == "adventurer" && e.system.adventurer_type == "hireling") {
        let hearts = [];
        let slashes_left = e.system.heart_slashes ?? 0;
        // Distribute slashes
        if (slashes_left > 1) {
          hearts[1] = "slashed-2";
          slashes_left -= 2;
        } else if (slashes_left == 1) {
          hearts[1] = "slashed-1";
          slashes_left = 0;
        } else {
          hearts[1] = "";
        }
        let hireling = e;
        hireling.system.hearts = hearts;
        hirelings.push(hireling);
      }
    });

    sheetData.adventurers = adventurers;
    sheetData.hirelings = hirelings;

    return sheetData;
  }


  /* -------------------------------------------- */

  async _onHeartSetSlashes(event) {

    if (event.currentTarget.classList.contains("greyed")) {
      return;
    }

    let selected_heart = event.currentTarget.control.value;
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.document.items.get(itemId);

    const hearts = item.system.tier + 1;
    const slashes = item.system.heart_slashes ?? 0;
    let new_slashes = slashes;

    if (event.currentTarget.classList.contains("slashed-2")) {
      // Remove slashes from current heart and all hearts to the left
      new_slashes = (hearts - selected_heart) * 2;
    } else if (event.currentTarget.classList.contains("slashed-1")) {
      // Set current heart to slashed 2
      new_slashes = (hearts - selected_heart + 1) * 2;
    } else {
      // Set current heart to slashed 1 and all to the right to slashed 2
      new_slashes = (hearts - selected_heart) * 2 + 1;
    }

    // Update Data
    item.update({ ['system.heart_slashes']: new_slashes });
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-open-editor').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.document.items.get(element.data("itemId"));
      item?.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      this.document.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
      element.slideUp(200, () => this.render(false));
    });

    // Add a new Adventurer
    html.find('.add-item').click(ev => {
      WickedHelpers._addOwnedItem(ev, this.document);
    });

    // Update Hearts
    html.find('#adventure-party .adv-heart').click(this._onHeartSetSlashes.bind(this));

  }

  /* -------------------------------------------- */
  /*  Form Submission  (Check relevance)          */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    return super._updateObject(event, formData);
  }
  /* -------------------------------------------- */

}