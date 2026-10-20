import { WickedSheet } from "./wicked-sheet.js";

const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * @extends {WickedSheet}
 */
export class WickedFactionSheet extends WickedSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "actor"],
      template: "systems/wicked-ones/templates/faction-sheet.html",
      width: 400,
      height: 500,
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

    return sheetData;
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    const img = this.actor.prototypeToken.texture.src;

    if (!img || img.indexOf(`/default-images/faction-token`) !== -1) {
      let image_path = `systems/wicked-ones/styles/assets/default-images/faction-token-${formData['system.category']}-${Math.max(1, formData['system.tier.value'])}.webp`;
      formData['prototypeToken.texture.src'] = image_path;

      let data = [];
      let image = { "texture.src": image_path };
      let tokens = this.actor.getActiveTokens();

      tokens.forEach(function (token) {
        data.push(foundry.utils.mergeObject(
          { _id: token.id },
          image
        ));
      });

      if (data.length > 0 && game.scenes.current) {
        await TokenDocument.updateDocuments(data, { parent: game.scenes.current });
      }
    }

    // Update the Actor
    return super._updateObject(event, formData);
  }

  /* -------------------------------------------- */

}