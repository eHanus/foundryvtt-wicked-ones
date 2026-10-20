import { WickedSheet } from "./wicked-sheet.js";
import { WickedHelpers } from "./wicked-helpers.js";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * @extends {WickedSheet}
 */
export class WickedGMSheet extends WickedSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "gamemaster"],
      template: "systems/wicked-ones/templates/gm-sheet.html",
      width: 830,
      height: 850,
      tabs: [{ navSelector: ".tabs", contentSelector: ".tab-content", initial: "clocks" }]
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

    // Progressively count up the invasion items
    let invasions = [];
    let invasion_count = 0;

    sheetData.items.forEach(i => {
      if (i.type == "invasion") {
        let invasion = i;
        invasion.system.inv_number = ++invasion_count;
        invasions.push(invasion);
      }
    });

    sheetData.invasions = invasions;

    // Add a hint for the selected phase and scaffold HTML
    sheetData.system.phase_hint = "<ul>";
    for (var i = 1; i < 10; i++) {
      let new_hint = "FITD.CYCLE.PHASE" + sheetData.system.current_phase.value + ".Hint" + i;
      let new_hint_loc = game.i18n.localize(new_hint);
      if (new_hint == new_hint_loc) {
        break;
      }
      sheetData.system.phase_hint += "<li>" + new_hint_loc + "</li>";
    }
    sheetData.system.phase_hint += "</ul>";

    return sheetData;
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
      this.actor.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
      element.slideUp(200, () => this.render(false));
    });

    // Add a new Adventurer --> Change to player, clock, invasion ...
    html.find('.add-item').click(ev => {
      WickedHelpers._addOwnedItem(ev, this.actor);
    });

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