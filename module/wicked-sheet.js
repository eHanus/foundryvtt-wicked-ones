import { WickedHelpers } from "./wicked-helpers.js";

const { ActorSheet } = foundry.appv1.sheets;
const { Dialog } = foundry.appv1.api;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class WickedSheet extends ActorSheet {

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-add-popup").click(this._onItemAddClick.bind(this));
    html.find(".skill-practice-xp").click(this._onSkillSetPracticeXP.bind(this));
    html.find('.item-checkmark input').click(ev => ev.target.select()).change(this._onCheckmarkChange.bind(this));
    html.find('.item-radio input').click(ev => ev.target.select()).change(this._onRadioChange.bind(this));
    html.find('#project-clocks-table .project-clock .blades-clock').click(this._onProjectClockClick.bind(this));
    html.find('.eye-rays area').mouseover(this._onDSMouseOver.bind(this));
    html.find('.eye-rays area').mouseout(this._onDSMouseOut.bind(this));
    html.find(".open-minion-pack").click(this._onMinionOpenClick.bind(this));
    html.find(".candle-button").click(this._onCandleButtonPressed.bind(this));

    // Item Dragging
    if (this.document.isOwner) {
      // Core handlers from foundry.js
      var handler = ev => this._onDragStart(ev);
      html.find('.draggable-items .item').each((i, item) => {
        if (item.classList.contains("inventory-header")) return;
        item.setAttribute("draggable", true);
        item.addEventListener("dragstart", handler, false);
      });
    }

    // This is a workaround until is being fixed in FoundryVTT.
    if (this.options.submitOnChange) {
      html.on("change", "textarea", this._onChangeInput.bind(this));  // Use delegated listener on the form
    }

    html.find(".roll-die-attribute").click(this._onRollAttributeDieClick.bind(this));
    html.find(".roll-basic").click(this._onBasicRollClick.bind(this));
  }


  async _onItemAddClick(event) {
    // Check if a pop-up item picker is open and bring that one to the front
    for (var i in ui.windows) {
      if (ui.windows[i].id == "add-items-popup") {
        ui.windows[i].bringToTop();
        return;
      }
    }

    event.preventDefault();
    const item_type = $(event.currentTarget).data("itemType");
    const distinct = $(event.currentTarget).data("distinct");
    let input_type = "checkbox";

    if (typeof distinct !== "undefined") {
      input_type = "radio";
    }

    let items = await WickedHelpers.getAllItemsByType(item_type, game);

    // Sort Special Abilities, Rooms, Upgrades and Monster Races
    if (items.length > 0) {
      switch (items[0].type) {
        case "conquest_ability":
          items.sort(WickedHelpers.conquestAbilitySort);
          break;
        case "minion_upgrade":
          items.sort(WickedHelpers.minionUpgradeSort);
          // Remove non-applicable upgrades for Minion Sheets
          if (this.object.system.mp_type == "normal") {
            items = items.filter(function (item) {
              return item.system.is_for_wo;
            });
          } else if (this.object.system.mp_type == "undead") {
            items = items.filter(function (item) {
              return item.system.is_for_ua;
            });
          }
          break;
        case "wickedimpulse":
          // Remove non-applicable upgrades for Minion Sheets
          if (this.object.system.is_awakened) {
            items = items.filter(function (item) {
              return item.system.is_for_ua;
            });
          } else {
            items = items.filter(function (item) {
              return !(item.system.is_for_ua);
            });
          }
          break;
        case "minionimpulse":
          // Remove non-applicable upgrades for Minion Sheets
          if (this.object.system.mp_type == "undead") {
            items = items.filter(function (item) {
              return item.system.is_for_ua;
            });
          } else {
            items = items.filter(function (item) {
              return !(item.system.is_for_ua);
            });
          }
          break;
        case "monster_race":
          // Remove primals for Minion Sheets
          if (this.object.type == "minion_pack") {
            items = items.filter(function (item) {
              return !(item.system.primal);
            });
          }
          items.sort(WickedHelpers.monsterRaceSort);
          break;
        case "specialability":
          if (this.object.system.is_awakened) {
            items.sort(WickedHelpers.specialAbilitySortUA);
          }
          else {
            items.sort(WickedHelpers.specialAbilitySortWO);
          }
          break;
        case "tier3room":
          items.sort(WickedHelpers.tierThreeRoomSort);
          break;
        default:
      }
    }

    let html = `<div id="items-to-add">`;

    items.forEach(e => {
      let itemPrefix = ``;
      let itemSuffix = ``;
      let itemTooltip = e.system.description ?? "";
      switch (item_type) {

        case "conquest_ability":
          if (typeof e.system.domain !== "undefined") {
            itemPrefix += `(${game.i18n.localize(CONFIG.WO.ua_conquest_domains[e.system.domain])}): `;
          }
          if (e.system.is_core) {
            itemSuffix += ` (` + game.i18n.localize(`FITD.Core`) + `)`;
          }
          break;

        case "minion_upgrade":
          if (e.system.upgrade_type == 'external') {
            itemSuffix += ` (` + game.i18n.localize(`FITD.External`) + `)`;
          } else if (e.system.upgrade_type == 'path') {
            itemSuffix += ` (` + game.i18n.localize(`FITD.MagicPath`) + `)`;
          }
          break;

        case "monster_race":
          if (e.system.primal) {
            itemSuffix += ` (` + game.i18n.localize(`FITD.Primal`) + `)`;
          }
          break;

        case "specialability":
          if (typeof e.system.source !== "undefined") {
            itemPrefix += `(${e.system.source}): `;
          }
          if (e.system.ability_group == 'group_core') {
            itemSuffix += ` (` + game.i18n.localize(`FITD.Core`) + `)`;
          } else if (e.system.ability_group == 'group_ext') {
            itemSuffix += ` (` + game.i18n.localize(`FITD.External`) + `)`;
          }
          if (itemTooltip == "") {
            itemTooltip = game.i18n.localize('FITD.ItemIsOfType') + ' ' + game.i18n.localize(CONFIG.WO.special_ability_types[e.system.ability_type]);
          }
          break;

        case "tier3room":
          if (typeof e.system.theme !== "undefined") {
            itemPrefix += `(${e.system.theme}): `;
          }
          break;

        default:
      }

      html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
      html += `<label class="`;
      if (e.system.ability_group == 'group_ext') {
        html += `flex-horizontal external`;
      }
      else if (this.object.system.is_awakened == e.system.is_ua_ability) {
        html += `flex-horizontal `;
      }
      else {
        html += `flex-horizontal cross-system`;
      }
      html += `" for="select-item-${e._id}">`;
      html += `${itemPrefix}${game.i18n.localize(e.name)}${itemSuffix}`;
      if (itemTooltip != "") {
        var cleanTip = itemTooltip.replace('"', '&quot;');
        html += `<i class="tooltip quick fas fa-question-circle" data-tooltip="${cleanTip}"></i>`;
      }
      html += `</label>`;
    });

    html += `</div>`;

    const label = CONFIG.Item?.typeLabels?.[item_type] ?? item_type;
    let title = game.i18n.has(label) ? game.i18n.localize(label) : item_type;

    let options = {
      id: "add-items-popup"
    };

    let dialog = new Dialog({
      title: `${game.i18n.localize('Add')} ${game.i18n.localize(title)}`,
      content: html,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('Add'),
          callback: (dialogHtml) => this.addItemsToSheet(item_type, dialogHtml.find('#items-to-add'))
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('Cancel'),
          callback: () => false
        }
      },
      default: "two",
      render: html => {},
    }, options);

    dialog.render(true);
  }

  /* -------------------------------------------- */

  async addItemsToSheet(item_type, el) {

    let items = await WickedHelpers.getAllItemsByType(item_type, game);
    let items_to_add = [];
    el.find("input:checked").each(function () {
      const found = items.find(e => e._id === $(this).val());
      if (found) items_to_add.push(found.toObject());
    });
    if (items_to_add.length > 0) {
      return this.document.createEmbeddedDocuments("Item", items_to_add);
    }
  }
  /* -------------------------------------------- */

  /**
   * Roll an Attribute die.
   * @param {*} event
   */
  async _onRollAttributeDieClick(event) {

    let target = $(event.currentTarget);
    const attribute_name = target.data("rollAttribute");
    const attribute_value = target.data("rollValue");
    const roll_type = target.data("rollType");
    const roll_for = target.data("rollFor");

    // Check if an attribute value was passed on the roll
    if (attribute_value) {
      this.document.rollAttributePopup(attribute_name, attribute_value, roll_type, roll_for);
    } else {
      this.document.rollAttributePopup(attribute_name, null, roll_type, roll_for);
    }

  }

  /* -------------------------------------------- */

  async _onSkillSetPracticeXP(event) {
    event.preventDefault();
    let pressed_button = event.currentTarget.control;
    const attribute_name = pressed_button.name.split(".")[2];
    const skill_name = pressed_button.name.split(".")[4];
    const temp_var = pressed_button.value;
    let skill = this.document.system.attributes[attribute_name].skills[skill_name];

    // Set Practice XP
    if (temp_var == 0 || temp_var > 1 || skill.value > 1) {
      skill.practice = 0;
    }
    else {
      if (skill.value == 0) {
        skill.practice = 1;
      }
      else if (skill.practice == 1) {
        skill.practice = 2;
      }
      else if (skill.practice == 2) {
        skill.practice = 0;
      }
      else {
        skill.practice = 0;
        pressed_button = pressed_button.previousElementSibling.previousElementSibling;
      }
    }

    // Update Data
    this.document.update({ ['system.attributes.' + attribute_name + '.skills.' + skill_name + '.practice']: skill.practice });

    // Submit click
    pressed_button.click();
  }

  /* -------------------------------------------- */

  /**
   * Change the Checkbox Status in an Owned Item within the Actor
   */
  async _onCheckmarkChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const propertyToSet = event.currentTarget.dataset.propertyToSet;
    const item = this.document.items.get(itemId);
    return item.update({ ['system.' + propertyToSet]: event.target.checked });
  }

  /* -------------------------------------------- */

  /**
   * Change the Radio Button Status of an Owned Item within the Actor
   */
  async _onRadioChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const propertyToSet = event.currentTarget.dataset.propertyToSet;
    const item = this.document.items.get(itemId);
    return item.update({ ['system.' + propertyToSet]: event.target.value });
  }

  /* -------------------------------------------- */

  /**
   * Change the class of the doomseeker when the mouse enters the image map area
   */
  async _onDSMouseOver(event) {
    event.currentTarget.parentNode.previousElementSibling.classList.add('hovered');
    return;
  }

  /* -------------------------------------------- */

  /**
   * Change the class of the doomseeker when the mouse leaves the image map area
   */
  async _onDSMouseOut(event) {
    event.currentTarget.parentNode.previousElementSibling.classList.remove('hovered');
    return;
  }

  /* -------------------------------------------- */

  /**
   * Make the progress clocks in the frontend items clickable
   */
  async _onProjectClockClick(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.document.items.get(itemId);

    if (event.target.value == 0) {
      // set clock progress to 0
      return item.update({ ['system.clock_progress']: 0 });
    }
    const clockRect = event.currentTarget.closest(".blades-clock").getBoundingClientRect();
    const centerX = clockRect.x + clockRect.width / 2;
    const centerY = clockRect.y + clockRect.height / 2;
    const offsetX = event.clientX - centerX;
    const offsetY = centerY - event.clientY;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (distance > clockRect.width / 2) {
      // Return without action outside the circle
      return;
    }
    const slope = (offsetX >= 0 ? Math.atan2(offsetX, offsetY) : Math.atan2(offsetX, offsetY) + 2 * Math.PI);
    const segmentArc = Math.PI * 2 / item.system.clock_size;
    const clickedSegment = Math.ceil(slope / segmentArc);

    // set clock progress to clicked segment
    return item.update({ ['system.clock_progress']: clickedSegment });

  }

  /* -------------------------------------------- */

  /**
   * Open a Minion Pack sheet
   * @param {*} event
   */
  async _onMinionOpenClick(event) {

    event.preventDefault();
    const actor = game.actors.get(this.document.system.minionpack);
    if (!actor) return;
    const sheet = actor.sheet;

    // If the sheet is already rendered:
    if (sheet.rendered) {
      sheet.maximize();
      sheet.bringToTop();
    }

    // Otherwise render the sheet
    else sheet.render(true);
  }

  /* -------------------------------------------- */


  async _onCandleButtonPressed(event) {
    event.preventDefault();
    let pressed_button = event.currentTarget;
    const button_name = pressed_button.id.split("-")[3];
    let candle = this.document.system.candle_progress;

    // Set Candle Value
    if (button_name == "plus") {
      candle.value += 1;
    }
    else if (button_name == "minus") {
      candle.value -= 1;
    }
    if (candle.value > candle.max) {
      candle.value = candle.max;
    }
    else if (candle.value < candle.min) {
      candle.value = candle.min;
    }

    // Update Data
    this.document.update({ ['system.candle_progress.value']: candle.value });
  }

  async _onBasicRollClick(event) {
    let target = $(event.currentTarget);
    const roll_type = target.data("rollType");
    const roll_default = target.data("rollDefault") ?? 2;
    const roll_max = target.data("rollMax") ?? 4;

    this.document.rollBasicPopup(roll_type, roll_default, roll_max);
  }

  /* -------------------------------------------- */

}