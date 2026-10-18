import { wickedRoll } from "./wicked-roll.js";
import { WickedHelpers } from "./wicked-helpers.js";

const { Dialog } = foundry.appv1.api;

/**
 * Extend the basic Actor
 * @extends {Actor}
 */
export class WickedActor extends Actor {

  /**
   * Create a new entity using provided input data
   * @override
   */
  static async create(data, options = {}) {
    if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).includes("type")) {

      if (!(Object.keys(data).includes("prototypeToken"))) {
        data.prototypeToken = {};
        data.prototypeToken.texture = {};
      }
      switch (data.type) {
        case "character":
        case "dungeon":
        case "faction":
        case "faction_ua":
        case "minion_pack":
        case "party":
        case "conquest_ua":
          // Replace default image
          data.img = data.img || `systems/wicked-ones/styles/assets/default-images/${data.type}.webp`;
          data.prototypeToken.texture.src = data.prototypeToken.texture.src || `systems/wicked-ones/styles/assets/default-images/${data.type}-token.webp`;
          data.prototypeToken.actorLink = true;
          break;
        case "clock":
          data.prototypeToken.actorLink = true;
          data.prototypeToken.displayName = 50;
          break;
        default:
      }

      // Special settings for the faction token
      if (data.type == "faction") {
        foundry.utils.mergeObject(
          data.prototypeToken,
          {
            displayName: 50,
            lockRotation: true,
            vision: false,
            actorLink: true
          },
          { overwrite: false }
        );
      }
    }
    return await super.create(data, options);
  }

  /* -------------------------------------------- */

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  /** @override */
  prepareData() {
    super.prepareData();

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (this.type === 'character') this._prepareWickedOneData();
    if (this.type === 'dungeon') this._prepareDungeonData();
    if (this.type === 'faction') this._prepareFactionData();
    if (this.type === 'faction_ua') this._prepareFactionUAData();
  }


  /* -------------------------------------------- */


  /**
   * Prepare Wicked One data
   */
  _prepareWickedOneData() {
    const data = this.system;
    const items = this.items.contents;

    // Make modifications to data here.
    data.is_primal_monster = false;
    data.primal_monster_type = "";
    data.calling_name = "";

    for (var i = 0; i < items.length; i++) {
      if (items[i].type == "monster_race") {
        data.is_primal_monster = items[i].system.primal;
        if (data.is_primal_monster) {
          data.primal_monster_type = items[i].name;
        }
      } else if (items[i].type == "calling") {
        data.calling_name = items[i].name;
      }
    }

    let removeAt = -1;

    // Put abilities in their respective groups
    for (var i = 0; i < items.length; i++) {
      if (items[i].type == "specialability" && items[i].system.ability_group == "group_general") {
        if (data.is_primal_monster) {
          if (items[i].system.source != data.primal_monster_type) {
            items[i].system.flex_slot = true;
          } else {
            items[i].system.flex_slot = false;
          }
        } else if (items[i].system.source != data.calling_name) {
          items[i].system.flex_slot = true;
        }
      } else if (items[i].type == "calling" && data.is_primal_monster) {
        removeAt = i;
      }
    }
    // Remove callings for primal monsters
    if (removeAt != -1) {
      items.splice(removeAt, 1);
    }

  }

  /* -------------------------------------------- */

  /**
   * Prepare Dungeon data
   */
  _prepareDungeonData() {
    const data = this.system;
    const items = this.items.contents;

    // Make modifications to data here.
    data.has_no_theme = true;

    for (var i = 0; i < items.length; i++) {
      if (items[i].type == "dungeon_theme") {
        data.has_no_theme = false;
        break;
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare Faction data
   */
  _prepareFactionData() {
    const data = this.system;

    // Make modifications to data here.
    data.clock_active_1 = (data.clock1.max != 0);
    data.clock_active_2 = (data.clock2.max != 0);
    data.clock_uid_1 = this._id + "-1";
    data.clock_uid_2 = this._id + "-2";
  }

  /* -------------------------------------------- */

  /**
   * Prepare UA Faction data
   */
  _prepareFactionUAData() {
    const data = this.system;

    // Make modifications to data here.

  }

  /* -------------------------------------------- */
  /** @override */
  getRollData() {
    const data = super.getRollData();

    data.dice_amount = this.getAttributeDiceToThrow();
    data.default_bonus = this.getAttributeDefaultBonus();

    return data;
  }

  /* -------------------------------------------- */

  /**
   * Calculate Attribute Dice to throw.
   */
  getAttributeDiceToThrow() {

    // Calculate Dice to throw.
    let dice_amount = {};

    // Add extra values for braineater disciplines and doomseeker eye rays if available
    this.items.forEach(specialAbility => {
      if (specialAbility.type == "specialability" && specialAbility.system.ability_type == "ds_eyes") {
        for (var i = 1; i < 10; i++) {
          dice_amount[specialAbility.system.primal['ds_eye_ray_' + i]] = parseInt(specialAbility.system.primal['ds_eye_ray_' + i + '_val']);
        }
      } else if (specialAbility.type == "specialability" && specialAbility.system.ability_type == "be_psi") {
        dice_amount[specialAbility.system.primal.be_psi_skill_name] = parseInt(specialAbility.system.primal.be_psi_dots);
      }
    });

    let attr = this.system.attributes;
    for (var attr_name in attr) {
      for (var skill_name in attr[attr_name].skills) {
        let val = parseInt(attr[attr_name].skills[skill_name]['value'][0]);
        if (val == 1 &&
            attr[attr_name].skills[skill_name].practice != undefined &&
            attr[attr_name].skills[skill_name].practice != 0) {
          val = 0;
        }
        dice_amount[skill_name] = val;
      }
    }

    return dice_amount;
  }

  /* -------------------------------------------- */

  /*
   * Calculate Attribute Default Bonus Dice to throw.
   */
  getAttributeDefaultBonus() {

    // Calculate Dice to throw.
    let dice_amount = {};

    // Add extra values for braineater disciplines and doomseeker eye rays if available
    this.items.forEach(specialAbility => {
      if (specialAbility.type == "specialability" && specialAbility.system.ability_type == "ds_eyes") {
        for (var i = 1; i < 10; i++) {
          dice_amount[specialAbility.system.primal['ds_eye_ray_' + i]] = this.system.attributes["guts"].shocked ? -1 : 0;
        }
      } else if (specialAbility.type == "specialability" && specialAbility.system.ability_type == "be_psi") {
        dice_amount[specialAbility.system.primal.be_psi_skill_name] = this.system.attributes["guts"].shocked ? -1 : 0;
      }
    });

    for (var attibute_name in this.system.attributes) {
      for (var skill_name in this.system.attributes[attibute_name].skills) {
        if (this.type == "minion_pack") {
          dice_amount[skill_name] = this.system.bloodied ? -1 : 0;
        } else {
          dice_amount[skill_name] = this.system.attributes[attibute_name].shocked ? -1 : 0;
        }
      }

    }

    return dice_amount;
  }

  /* -------------------------------------------- */

  rollAttributePopup(attribute_name, attribute_value = null, roll_type = null, for_name = null) {

    let attribute_label = WickedHelpers.getAttributeLabel(attribute_name);

    // Calculate Dice Amount for Attributes
    var dice_amount = attribute_value ? attribute_value : 0;
    var default_bonus = 0;
    if (attribute_value == null && attribute_name !== "") {
      let roll_data = this.getRollData();
      dice_amount += roll_data.dice_amount[attribute_name];
      default_bonus += roll_data.default_bonus[attribute_name];
    }

    let options = {
      id: "dice-roll-popup",
    };

    let typeOptions = "";
    let hideAction = "";

    if (roll_type == null) {
      typeOptions = `
        <option value="action" selected>${game.i18n.localize('FITD.ROLL.ACTION.Name')}</option>
        <option value="resistance">${game.i18n.localize('FITD.ROLL.RESISTANCE.Name')}</option>
      `;
    } else {
      hideAction = " hidden";
      typeOptions = `<option value="${roll_type}" selected>${game.i18n.localize('FITD.ROLL.' + roll_type.toUpperCase() + '.Name')}</option>`;
    }

    new Dialog({
      title: `${game.i18n.localize('FITD.Roll')}${game.i18n.localize(attribute_label)}`,
      content: `
        <div id="skill-roll">
          <h2>${game.i18n.localize('FITD.Roll')} ${game.i18n.localize(attribute_label)} (${dice_amount}D)</h2>
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('FITD.RollType')}:</label>
              <select id="type" name="type">
                ${typeOptions}
              </select>
            </div>
            <div class="form-group roll-type-action${hideAction}">
              <label>${game.i18n.localize('FITD.Position')}:</label>
              <select id="pos" name="pos">
                <option value="dominant">${game.i18n.localize('FITD.PositionDominant')}</option>
                <option value="default" selected>${game.i18n.localize('FITD.PositionDefault')}</option>
                <option value="dire">${game.i18n.localize('FITD.PositionDire')}</option>
                <option value="deadly">${game.i18n.localize('FITD.PositionDeadly')}</option>
              </select>
            </div>
            <div class="form-group roll-type-resistance hidden">
              <label>${game.i18n.localize('FITD.DeadlyPosition')}:</label>
              <select id="deadly" name="deadly">
                <option value="default" selected>${game.i18n.localize('FITD.No')}</option>
                <option value="deadly">${game.i18n.localize('FITD.Yes')}</option>
              </select>
            </div>
            <div class="form-group roll-type-action${hideAction}">
              <label>${game.i18n.localize('FITD.Effect')}:</label>
              <select id="fx" name="fx">
                <option value="strong">${game.i18n.localize('FITD.EffectStrong')}</option>
                <option value="default" selected>${game.i18n.localize('FITD.EffectDefault')}</option>
                <option value="weak">${game.i18n.localize('FITD.EffectWeak')}</option>
                <option value="zero">${game.i18n.localize('FITD.EffectZero')}</option>
              </select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('FITD.Modifier')}:</label>
              <select id="mod" name="mod" data-base-dice="${dice_amount}">
                ${this.createListOfDiceMods(-3, +3, default_bonus)}
              </select>
            </div>
            <div class="total-rolled form-group">
              <label class="total-rolled">${game.i18n.localize('FITD.TotalSkillDice')}: </label>
              <label>${dice_amount + default_bonus}D</label>
            </div>
          </form>
          <h2 class="${hideAction}">${game.i18n.localize('FITD.RollOptions')}</h2>
          <div class="action-info${hideAction}">${game.i18n.localize('FITD.ActionsHelp')}</div>
        </div>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize('FITD.Roll'),
          callback: (html) => {
            let type = html.find('[name="type"]')[0].value;
            let position = html.find('[name="pos"]')[0].value;
            let effect = html.find('[name="fx"]')[0].value;
            let modifier = parseInt(html.find('[name="mod"]')[0].value);
            if (type == 'resistance') {
              position = html.find('[name="deadly"]')[0].value;
            }
            if (attribute_value == null) {
              this.rollAttribute(attribute_name, modifier, position, effect, type, for_name);
            } else {
              this.rollAttribute("", (dice_amount - 1 + modifier), position, effect, type, for_name);
            }
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('Close'),
        },
      },
      default: "yes",
      render: html => {
        html.find("#skill-roll #type").change(this._onRollTypeChange);
        html.find("#skill-roll #mod").change(this._onDiceModChange);
      },
    }, options).render(true);

  }

  /* -------------------------------------------- */

  rollAttribute(attribute_name = "", additional_dice_amount = 0, position, effect, type, for_name = null) {

    let dice_amount = 0;
    if (attribute_name !== "") {
      let roll_data = this.getRollData();
      dice_amount += roll_data.dice_amount[attribute_name];
    }
    else {
      dice_amount = 1;
    }
    dice_amount += additional_dice_amount;

    wickedRoll(dice_amount, attribute_name, position, effect, type, for_name ? for_name : this.name);
  }

  rollBasicPopup(roll_type = "fortune", default_dice = 0, max_dice = 4) {
    new Dialog({
      title: `Dice Roller`,
      content: `
        <h2>${game.i18n.localize("FITD.RollSomeDice")}</h2>
        <p>${game.i18n.localize("FITD.RollTokenDescription")}</p>
        <form id="dice-roller">
          <div class="form-group">
            <label>${game.i18n.localize('FITD.RollType')}:</label>
            <select id="type" name="type">
              <option value="${roll_type}" selected>${game.i18n.localize('FITD.ROLL.' + roll_type.toUpperCase() + '.Name')}</option>
            </select>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize("FITD.RollNumberOfDice")}:</label>
            <select id="qty" name="qty">
              ${Array(max_dice + 1).fill().map((item, i) => `<option value="${i}" ${default_dice == i ? 'selected' : ''}>${i}D</option>`).join('')}
            </select>
          </div>
        </form>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Roll`,
          callback: (html) => {
            let diceQty = html.find('[name="qty"]')[0].value;
            let type = html.find('[name="type"]')[0].value;
            wickedRoll(diceQty, "", "default", "default", type, this.name);
          },
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('Cancel'),
        },
      },
      default: "yes"
    }).render(true);
  }

  rollBasic(roll_type = "fortune", dice = 1) {
    wickedRoll(dice, "", "default", "default", roll_type, this.name);
  }

  /* -------------------------------------------- */

  /**
   * Create <options> for available actions
   *  which can be performed.
   */
  createListOfActions() {

    let text = "";
    let attribute, skill;
    let attributes = this.system.attributes;

    for (attribute in attributes) {

      var skills = attributes[attribute].skills;

      text += `<optgroup label="${attribute} Actions">`;
      text += `<option value="${attribute}">${attribute} (Resist)</option>`;

      for (skill in skills) {
        text += `<option value="${skill}">${skill}</option>`;
      }

      text += `</optgroup>`;

    }

    return text;

  }

  /* -------------------------------------------- */

  /**
   * Creates <options> modifiers for dice roll.
   *
   * @param {int} rs
   *  Min die modifier
   * @param {int} re
   *  Max die modifier
   * @param {int} s
   *  Selected die
   */
  createListOfDiceMods(rs, re, s) {

    var text = ``;
    var i = 0;

    if (s == "") {
      s = 0;
    }

    for (i = rs; i <= re; i++) {
      var plus = "";
      if (i >= 0) { plus = "+"; }
      text += `<option value="${i}"`;
      if (i == s) {
        text += ` selected`;
      }

      text += `>${plus}${i}D</option>`;
    }

    return text;

  }

  /* -------------------------------------------- */

  /**
   * Change dice total on display
   * @param {*} event
   */
  async _onDiceModChange(event) {
    let mod = this.value;
    let base = this.dataset.baseDice;

    $("#skill-roll .total-rolled label:nth-child(2)").text(parseInt(base) + parseInt(mod) + "D");
  }

  /* -------------------------------------------- */

  /**
   * Change options for different roll types
   * @param {*} event
   */
  async _onRollTypeChange(event) {

    if (this.value == 'action') {
      $("#skill-roll .roll-type-action").removeClass('hidden');
      $("#skill-roll .roll-type-resistance").addClass('hidden');
    } else if (this.value == 'resistance') {
      $("#skill-roll .roll-type-action").addClass('hidden');
      $("#skill-roll .roll-type-resistance").removeClass('hidden');
    } else {
      $("#skill-roll .roll-type-action").addClass('hidden');
      $("#skill-roll .roll-type-resistance").addClass('hidden');
    }
  }

  /* -------------------------------------------- */
}