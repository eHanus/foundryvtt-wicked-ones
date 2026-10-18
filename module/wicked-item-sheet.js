const { ItemSheet } = foundry.appv1.sheets;

/**
 * Extend the basic ItemSheet
 * @extends {ItemSheet}
 */
export class WickedItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["wicked-ones", "sheet", "item"],
      width: 'auto',
      height: 'auto',
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilitiestab" }]
    });
  }

  /* -------------------------------------------- */

  // Add config Values to local data object

  /** @override */
  async getData(options) {
    const sheetData = await super.getData(options);
    sheetData.editable = this.options.editable;
    sheetData.config = foundry.utils.deepClone(CONFIG.WO);

    sheetData.item = sheetData.data;
    sheetData.system = sheetData.document.system; // project system data so that handlebars has the same name and value paths

    // Prepare special ability data
    if (sheetData.item.type == "specialability") {

      if (sheetData.system.ability_type == "ds_eyes") {

        let assigned_rays = [];
        let available_rays = {};

        // Iterate through ray selectors and populate assigned rays
        for (var i = 1; i < 10; i++) {
          if (sheetData.system.primal['ds_eye_ray_' + i] != "") {
            assigned_rays.push(sheetData.system.primal['ds_eye_ray_' + i]);
          }
        }

        // Iterate through all rays and populate available rays
        for (const [key] of Object.entries(CONFIG.WO.doomseeker_eye_rays)) {
          if (assigned_rays.indexOf(key) == -1) {
            available_rays[key] = CONFIG.WO.doomseeker_eye_rays[key];
          }
        }

        // Iterate through ray selectors and populate available rays for selector
        for (var i = 1; i < 10; i++) {
          sheetData.config["available_rays" + i] = {};
          let val = sheetData.system.primal['ds_eye_ray_' + i];
          if (val != "") {
            // Add own selected value as available
            sheetData.config['available_rays' + i][val] = CONFIG.WO.doomseeker_eye_rays[val];
          }

          // Add available values to the list to select from
          for (const [key] of Object.entries(available_rays)) {
            available_rays[key] = CONFIG.WO.doomseeker_eye_rays[key];
            sheetData.config['available_rays' + i][key] = CONFIG.WO.doomseeker_eye_rays[key];
          }
        }
      }

      if (sheetData.system.ability_type == "be_psi") {
        sheetData.system.source = game.i18n.localize("FITD.Braineater");
      } else if (sheetData.system.ability_type == "ds_eyes") {
        sheetData.system.source = game.i18n.localize("FITD.Doomseeker");
      } else if (sheetData.system.ability_type == "fs_face") {
        sheetData.system.source = game.i18n.localize("FITD.Facestealer");
      } else if (sheetData.system.ability_type == "gm_path") {
        sheetData.system.source = game.i18n.localize("FITD.Goldmonger");
      }

    } else {
      switch (sheetData.item.type) {
        // Prepare dungeon duty data
        case "duty":
          sheetData.system.type_hint_prompt = "";
          sheetData.system.type_hint_paragraph1 = "";
          sheetData.system.type_hint_paragraph2 = "";
          switch (sheetData.system.type) {
            case "FITD.DUTY_TYPE.Creature":
              sheetData.system.type_hint_prompt = game.i18n.localize("FITD.DUTY_TYPE.HINT.CreaturePrompt");
              sheetData.system.type_hint_paragraph1 = game.i18n.localize("FITD.DUTY_TYPE.HINT.CreatureParagraph");
              break;
            case "FITD.DUTY_TYPE.Lock":
              sheetData.system.type_hint_prompt = game.i18n.localize("FITD.DUTY_TYPE.HINT.LockPrompt");
              sheetData.system.type_hint_paragraph1 = game.i18n.localize("FITD.DUTY_TYPE.HINT.LockParagraph1");
              sheetData.system.type_hint_paragraph2 = game.i18n.localize("FITD.DUTY_TYPE.HINT.LockParagraph2");
              break;
            case "FITD.DUTY_TYPE.Trap":
              sheetData.system.type_hint_prompt = game.i18n.localize("FITD.DUTY_TYPE.HINT.TrapPrompt");
              sheetData.system.type_hint_paragraph1 = game.i18n.localize("FITD.DUTY_TYPE.HINT.TrapParagraph1");
              sheetData.system.type_hint_paragraph2 = game.i18n.localize("FITD.DUTY_TYPE.HINT.TrapParagraph2");
              break;
            case "FITD.DUTY_TYPE.Trick":
              sheetData.system.type_hint_prompt = game.i18n.localize("FITD.DUTY_TYPE.HINT.TrickPrompt");
              sheetData.system.type_hint_paragraph1 = game.i18n.localize("FITD.DUTY_TYPE.HINT.TrickParagraph");
              break;

            default:
          }
          break;
        default:
      }

    }

    return sheetData;
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    const path = "systems/wicked-ones/templates/items";
    let simple_item_types = ["defense", "minion_type", "revelry", "awakened_type"];
    let template_name = `${this.item.type}`;

    if (simple_item_types.indexOf(this.item.type) >= 0) {
      template_name = "simple";
    }

    return `${path}/${template_name}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update shared supplies across actors
    html.find('.shared-supply-count').change(this._onSharedSupplyChange.bind(this));

    // Update adventurer class default passive skill
    html.find('#adventurer-class-select').change(this._onAdvClassChange.bind(this));

    // Update Inventory Item
    html.find('#item-type-select').change(ev => {
      const abilitytype = ev.currentTarget.value;
      const abilitygroup = html.find('#item-group-select')[0];
      if (!abilitygroup) return;
      switch (abilitytype) {
        case "be_psi":
        case "ds_eyes":
        case "gm_path":
          abilitygroup.value = "group_primal";
          break;
        case "fs_face":
          abilitygroup.value = "group_faces";
          break;

        case "basic":
        case "advanced":
        default:
          if (abilitygroup.value == "group_primal" || abilitygroup.value == "group_faces") {
            abilitygroup.value = "group_general";
          }
      }
    });

    /* -------------------------------------------- */

    // Update Edge List
    html.find('#edge-list input').change(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const idOffset = element[0]?.id ? element[0].id.lastIndexOf('-') + 1 : -1;
      const id = idOffset > 0 ? element[0].id.substring(idOffset) : this.object.id;
      const item = this.actor ? this.actor.items.get(id) : this.object;
      const newEdges = [];
      const inputs = html.find('#edge-list input');
      for (var i = 0; i < inputs.length; i++) {
        if (typeof inputs[i].value != "undefined" && inputs[i].value != "") {
          newEdges.push(inputs[i].value);
        }
      }
      item.update({ ['system.edges']: newEdges });
    });

    /* -------------------------------------------- */

    // Update Adventurer Custom Field
    html.find('select.list-with-custom').change(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const idOffset = element[0]?.id ? element[0].id.lastIndexOf('-') + 1 : -1;
      const id = idOffset > 0 ? element[0].id.substring(idOffset) : this.object.id;
      const item = this.actor ? this.actor.items.get(id) : this.object;
      const selected = ev.currentTarget.value;
      const propertyToSet = ev.currentTarget.dataset.propertyToSet;
      if (selected == "" || selected == "custom") {
        item.update({ ['system.' + propertyToSet]: "" });
      } else if (selected == "random") {
        const options = ev.currentTarget.length - 3;
        const choice = Math.floor(Math.random() * options) + 3;
        for (var i = 0; i < ev.currentTarget.length; i++) {
          if (i == choice) {
            ev.currentTarget[i].selected = true;
            if (ev.currentTarget.dataset.propertyToSet == 'adventurer_class_custom') {
              let data = this.getAdventurerTraits(ev.currentTarget[i].value);
              data['system.' + propertyToSet] = game.i18n.localize(ev.currentTarget[i].value);
              item.update(data);

            } else {
              item.update({ ['system.' + propertyToSet]: game.i18n.localize(ev.currentTarget[i].value) });
            }
          } else {
            ev.currentTarget[i].selected = false;
          }
        }
      } else {
        item.update({ ['system.' + propertyToSet]: game.i18n.localize(selected) });
      }
    });

    /* -------------------------------------------- */

    // Clock Size Changed
    html.find('#clock-type-list .clock-size-picker').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const idOffset = element[0]?.id ? element[0].id.lastIndexOf('-') + 1 : -1;
      const id = idOffset > 0 ? element[0].id.substring(idOffset) : this.object.id;
      const item = this.actor ? this.actor.items.get(id) : this.object;
      if (ev.target.value < item.system.clock_progress) {
        item.update({ ['system.clock_progress']: ev.target.value });
      }
      item.update({ ['system.clock_size']: ev.target.value });
    });

  }


  /* -------------------------------------------- */

  /**
   * Update shared supplies across characters
   * @param {*} event
   */
  async _onSharedSupplyChange(event) {
    event.preventDefault();

    let name = this.object.name;
    let value = event.currentTarget.value;

    const actors = game.actors.filter(entry => entry.type === "character");
    actors.forEach(actor => {
      actor.items.forEach(item => {
        if (item.name == name && item.type == "gearsupply") {
          if (item.system.gear_or_supply == "supply" && item.system.use_type == "shared") {
            item.update({ ['system.uses_left']: value });
          }
        }
      });
    });

  }

  /**
   * Update adventurer passive on class change
   * @param {*} event 
   */
  async _onAdvClassChange(event) {
    let newClass = event.currentTarget.value;
    if (newClass == "" || newClass == "random" || newClass == "custom") {
      return;
    }
    let data = this.getAdventurerTraits(event.currentTarget.value);
    this.object.update(data);
  }

  /**
   * Get adventurer traits by class
   * @param {*} adventurerClass 
   */
  getAdventurerTraits(adventurerClass) {

    let newName = game.i18n.localize(adventurerClass);
    let newPassive = game.i18n.localize(adventurerClass.replace('ADV_CLASS', 'ADV_CLASS_PASSIVE'));
    let newMotivation = '';
    let newPos = '';
    let newNeg = '';

    switch (adventurerClass) {
      case CONFIG.WO.adventurer_classes.academic:
        newMotivation = CONFIG.WO.adventurer_motivations.exploration;
        newPos = CONFIG.WO.positive_traits.clever;
        newNeg = CONFIG.WO.negative_traits.greedy;
        break;
      case CONFIG.WO.adventurer_classes.alchemist:
        newMotivation = CONFIG.WO.adventurer_motivations.thrills;
        newPos = CONFIG.WO.positive_traits.clever;
        newNeg = CONFIG.WO.negative_traits.impatient;
        break;
      case CONFIG.WO.adventurer_classes.amazon:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.honest;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.aristocrat:
        newMotivation = CONFIG.WO.adventurer_motivations.respect;
        newPos = CONFIG.WO.positive_traits.confident;
        newNeg = CONFIG.WO.negative_traits.brash;
        break;
      case CONFIG.WO.adventurer_classes.assassin:
        newMotivation = CONFIG.WO.adventurer_motivations.riches;
        newPos = CONFIG.WO.positive_traits.persistent;
        newNeg = CONFIG.WO.negative_traits.dishonest;
        break;
      case CONFIG.WO.adventurer_classes.barbarian:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.confident;
        newNeg = CONFIG.WO.negative_traits.dumb;
        break;
      case CONFIG.WO.adventurer_classes.bard:
        newMotivation = CONFIG.WO.adventurer_motivations.riches;
        newPos = CONFIG.WO.positive_traits.helpful;
        newNeg = CONFIG.WO.negative_traits.greedy;
        break;
      case CONFIG.WO.adventurer_classes.buccaneer:
        newMotivation = CONFIG.WO.adventurer_motivations.riches;
        newPos = CONFIG.WO.positive_traits.generous;
        newNeg = CONFIG.WO.negative_traits.cocky;
        break;
      case CONFIG.WO.adventurer_classes.centurion:
        newMotivation = CONFIG.WO.adventurer_motivations.respect;
        newPos = CONFIG.WO.positive_traits.steady;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.chaosmage:
        newMotivation = CONFIG.WO.adventurer_motivations.exploration;
        newPos = CONFIG.WO.positive_traits.optimistic;
        newNeg = CONFIG.WO.negative_traits.indecisive;
        break;
      case CONFIG.WO.adventurer_classes.cleric:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.generous;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.deathknight:
        newMotivation = CONFIG.WO.adventurer_motivations.vengeance;
        newPos = CONFIG.WO.positive_traits.persistent;
        newNeg = CONFIG.WO.negative_traits.cocky;
        break;
      case CONFIG.WO.adventurer_classes.defender:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.steady;
        newNeg = CONFIG.WO.negative_traits.indecisive;
        break;
      case CONFIG.WO.adventurer_classes.druid:
        newMotivation = CONFIG.WO.adventurer_motivations.vengeance;
        newPos = CONFIG.WO.positive_traits.honest;
        newNeg = CONFIG.WO.negative_traits.impatient;
        break;
      case CONFIG.WO.adventurer_classes.eldritchwarrior:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.optimistic;
        newNeg = CONFIG.WO.negative_traits.cocky;
        break;
      case CONFIG.WO.adventurer_classes.illusionist:
        newMotivation = CONFIG.WO.adventurer_motivations.thrills;
        newPos = CONFIG.WO.positive_traits.helpful;
        newNeg = CONFIG.WO.negative_traits.indecisive;
        break;
      case CONFIG.WO.adventurer_classes.inquisitor:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.persistent;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.knight:
        newMotivation = CONFIG.WO.adventurer_motivations.respect;
        newPos = CONFIG.WO.positive_traits.honest;
        newNeg = CONFIG.WO.negative_traits.cocky;
        break;
      case CONFIG.WO.adventurer_classes.lancer:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.confident;
        newNeg = CONFIG.WO.negative_traits.impatient;
        break;
      case CONFIG.WO.adventurer_classes.magehunter:
        newMotivation = CONFIG.WO.adventurer_motivations.vengeance;
        newPos = CONFIG.WO.positive_traits.persistent;
        newNeg = CONFIG.WO.negative_traits.brash;
        break;
      case CONFIG.WO.adventurer_classes.monk:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.steady;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.occultslayer:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.persistent;
        newNeg = CONFIG.WO.negative_traits.dishonest;
        break;
      case CONFIG.WO.adventurer_classes.ranger:
        newMotivation = CONFIG.WO.adventurer_motivations.exploration;
        newPos = CONFIG.WO.positive_traits.clever;
        newNeg = CONFIG.WO.negative_traits.impatient;
        break;
      case CONFIG.WO.adventurer_classes.scout:
        newMotivation = CONFIG.WO.adventurer_motivations.exploration;
        newPos = CONFIG.WO.positive_traits.helpful;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.shadowdancer:
        newMotivation = CONFIG.WO.adventurer_motivations.thrills;
        newPos = CONFIG.WO.positive_traits.clever;
        newNeg = CONFIG.WO.negative_traits.impatient;
        break;
      case CONFIG.WO.adventurer_classes.slinger:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.optimistic;
        newNeg = CONFIG.WO.negative_traits.indecisive;
        break;
      case CONFIG.WO.adventurer_classes.spellbow:
        newMotivation = CONFIG.WO.adventurer_motivations.thrills;
        newPos = CONFIG.WO.positive_traits.clever;
        newNeg = CONFIG.WO.negative_traits.greedy;
        break;
      case CONFIG.WO.adventurer_classes.templar:
        newMotivation = CONFIG.WO.adventurer_motivations.justice;
        newPos = CONFIG.WO.positive_traits.steady;
        newNeg = CONFIG.WO.negative_traits.stubborn;
        break;
      case CONFIG.WO.adventurer_classes.weaponsmith:
        newMotivation = CONFIG.WO.adventurer_motivations.challenge;
        newPos = CONFIG.WO.positive_traits.honest;
        newNeg = CONFIG.WO.negative_traits.cocky;
        break;
      case CONFIG.WO.adventurer_classes.wildling:
        newMotivation = CONFIG.WO.adventurer_motivations.thrills;
        newPos = CONFIG.WO.positive_traits.generous;
        newNeg = CONFIG.WO.negative_traits.dumb;
        break;
      default:
    }

    this.object.update({ ['name']: newName, ['system.passive']: newPassive });

    let data = {
      ['name']: newName,
      ['system.passive']: newPassive,
      ['system.motivation_1']: newMotivation,
      ['system.motivation_1_custom']: game.i18n.localize(newMotivation),
      ['system.motivation_2']: '',
      ['system.motivation_2_custom']: '',
      ['system.trait_pos_1']: newPos,
      ['system.trait_pos_1_custom']: game.i18n.localize(newPos),
      ['system.trait_pos_2']: '',
      ['system.trait_pos_2_custom']: '',
      ['system.trait_neg_1']: newNeg,
      ['system.trait_neg_1_custom']: game.i18n.localize(newNeg),
      ['system.trait_neg_2']: '',
      ['system.trait_neg_2_custom']: ''
    };
    return data;
  }

  /* -------------------------------------------- */
}