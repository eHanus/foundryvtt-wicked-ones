import { WickedSheet } from "./wicked-sheet.js";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WickedSheet}
 */
export class WickedMinionSheet extends WickedSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "actor"],
      template: "systems/wicked-ones/templates/minion-sheet.html",
      width: 650,
      height: 770,
      tabs: [{ navSelector: ".tabs", contentSelector: ".tab-content", initial: "upgrades" }]
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

    // Change the action ratings on display and flags depending on the sheet type
    sheetData.system.is_undead = false;
    switch (sheetData.system.mp_type) {
      case "normal":
        delete sheetData.system.attributes.guts.skills.horrify;
        delete sheetData.system.attributes.guts.skills.command;
        break;
      case "undead":
        delete sheetData.system.attributes.guts.skills.banter;
        delete sheetData.system.attributes.guts.skills.threaten;
        sheetData.system.is_undead = true;
        break;

      default:
    }

    // get localization string for the item roll name
    sheetData.items.forEach(i => {
      if (i.type == "minion_upgrade") {
        if (i.system.upgrade_type == "external" && i.system.upgrade_skill_name != "") {
          const loc = CONFIG.WO.rollable_skills[i.system.upgrade_skill_name];
          i.system.upgrade_skill_localization_ref = loc;
        }
      }
    });

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
      this.document.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
      element.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */

}