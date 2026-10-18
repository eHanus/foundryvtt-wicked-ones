import { WickedSheet } from "./wicked-sheet.js";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * @extends {WickedSheet}
 */
export class WickedConquestSheet extends WickedSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "actor"],
      template: "systems/wicked-ones/templates/conquest-sheet.html",
      width: 600,
      height: 850,
      tabs: [{ navSelector: ".tabs", contentSelector: ".tab-content", initial: "conquest-candle" }]
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
  /*  Form Submission  (Check relevance)          */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    return super._updateObject(event, formData);
  }
  /* -------------------------------------------- */

}