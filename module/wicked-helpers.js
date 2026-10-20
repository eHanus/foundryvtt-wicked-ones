export class WickedHelpers {

  /**
   * Removes a duplicate item type from charlist.
   *
   * @param {Object} item
   * @param {Entity} actor
   */
  static removeDuplicatedItemType(item, actor) {

    if (actor == null) {
      return;
    }

    let distinct_types = ["dungeon_theme", "calling", "goldmonger_type", "revelry", "monster_race", "minion_type"];
    let should_be_distinct = distinct_types.includes(item.type);
    // If the Item has the exact same name - remove it from list.
    // Remove Duplicate items from the array.
    actor.items.forEach(i => {
      if (item._id == i.id) { return; }
      let has_double = (item.type === i.type);
      if (i.name === item.name || (should_be_distinct && has_double)) {
        actor.deleteEmbeddedDocuments("Item", [i.id]);
      }
    });
  }

  /**
   * Add item modification if logic exists.
   * @param {Object} item
   * @param {Entity} entity
   */
  static callItemLogic(item, entity) {

    if ('logic' in item.system && item.system.logic !== '') {
      let logic = JSON.parse(item.system.logic);

      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

      if (logic) {

        logic.forEach(expression => {

          // Different logic behav. dep on operator.
          switch (expression.operator) {

            // Add when creating.
            case "addition":
              entity.update({
                [expression.attribute]: Number(WickedHelpers.getNestedProperty(entity, "system." + expression.attribute)) + expression.value
              });
              break;

            // Change name property.
            case "attribute_change":
              entity.update({
                [expression.attribute]: expression.value
              });
              break;

          }
        });
      }

    }

  }

  /**
   * Undo Item modifications when item is removed.
   * @todo
   *  - Remove all items and then Add them back to
   *    sustain the logic mods
   * @param {Object} item
   * @param {Entity} entity
   */
  static undoItemLogic(item, entity) {

    if ('logic' in item.system && item.system.logic !== '') {
      let logic = JSON.parse(item.system.logic);

      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

      if (logic) {

        var entity_data = entity.system;

        logic.forEach(expression => {
          // Different logic behav. dep on operator.
          switch (expression.operator) {

            // Subtract when removing.
            case "addition":
              entity.update({
                [expression.attribute]: Number(WickedHelpers.getNestedProperty(entity, "system." + expression.attribute)) - expression.value
              });
              break;

            // Change name back to default.
            case "attribute_change":
              // Get the array path to take data.
              let default_expression_attribute_path = expression.attribute + '_default';
              let default_name = default_expression_attribute_path.split(".").reduce((o, i) => o?.[i], entity_data);

              entity.update({
                [expression.attribute]: default_name
              });
              break;
          }
        });
      }
    }

  }

  /**
   * Get a nested dynamic attribute.
   * @param {Object} obj
   * @param {string} property
   */
  static getNestedProperty(obj, property) {
    return property.split('.').reduce((r, e) => {
      return r[e];
    }, obj);
  }


  /**
   * Add item functionality
   */
  static _addOwnedItem(event, actor) {

    event.preventDefault();
    const a = event.currentTarget;
    const item_type = a.dataset.itemType;

    let data = {
      name: foundry.utils.randomID(),
      type: item_type
    };
    return actor.createEmbeddedDocuments("Item", [data]);
  }

  /**
   * Get the list of all available ingame items by Type.
   *
   * @param {string} item_type
   * @param {Object} game
   */
  static async getAllItemsByType(item_type, game) {

    let list_of_items = [];
    let game_items = [];
    let compendium_items = [];

    game_items = game.items.filter(e => e.type === item_type).map(e => { return e; });

    let pack = game.packs.find(e => e.metadata.name === item_type);

    if (pack == null) {
      return game_items;
    }
    let compendium_content = await pack.getDocuments();

    compendium_items = compendium_content.map(e => { return e; });

    list_of_items = game_items.concat(compendium_items);

    list_of_items.sort(function (a, b) {
      var nameA = a.name.toUpperCase();
      var nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    return list_of_items;

  }

  /* -------------------------------------------- */

  /**
   * Returns the label for attribute.
   *
   * @param {string} attribute_name
   * @returns {string}
   */
  static getAttributeLabel(attribute_name) {
    // Calculate Dice to throw.
    let attribute_labels = {
      tier: "FITD.Tier"
    };
    const attributes = game.model.Actor.character.attributes;

    for (var attibute_name in attributes) {
      attribute_labels[attibute_name] = attributes[attibute_name].label;
      for (var skill_name in attributes[attibute_name].skills) {
        attribute_labels[skill_name] = attributes[attibute_name].skills[skill_name].label;
      }

    }

    for (var eye_ray in CONFIG.WO.doomseeker_eye_rays) {
      attribute_labels[eye_ray] = CONFIG.WO.doomseeker_eye_rays[eye_ray] + '.Name';
    }

    let result = typeof attribute_labels[attribute_name] !== 'undefined' ? attribute_labels[attribute_name] : attribute_name;

    return result;
  }

  /* -------------------------------------------- */

  /**
   * Returns true if a string is the localized version of a calling name
   *
   * @param {string} attribute_name
   * @returns {bool}
   */
  static isPrimalCalling(source_name) {
    switch (source_name) {
      case game.i18n.localize("FITD.GAME_LOGIC.Braineater"):
      case game.i18n.localize("FITD.GAME_LOGIC.Doomseeker"):
      case game.i18n.localize("FITD.GAME_LOGIC.Facestealer"):
      case game.i18n.localize("FITD.GAME_LOGIC.Goldmonger"):
        return true;
      default:
        return false;
    }
  }

  /* -------------------------------------------- */

  /**
   * Sorts Special Abilities by External, Primal Calling, Source, Core Status and Alphabet
   */
  static specialAbilitySortWO(a, b) {
    if (!(a.system.ability_group == "group_ext") && (b.system.ability_group == "group_ext")) {
      return -1;
    }
    if ((a.system.ability_group == "group_ext") && !(b.system.ability_group == "group_ext")) {
      return 1;
    }

    if (!a.system.is_ua_ability && b.system.is_ua_ability) {
      return -1;
    }
    if (a.system.is_ua_ability && !b.system.is_ua_ability) {
      return 1;
    }

    // Sort by remaining criteria
    return WickedHelpers.specialAbilitySort(a, b);
  }

  static specialAbilitySortUA(a, b) {
    if (!(a.system.ability_group == "group_ext") && (b.system.ability_group == "group_ext")) {
      return -1;
    }
    if ((a.system.ability_group == "group_ext") && !(b.system.ability_group == "group_ext")) {
      return 1;
    }

    if (a.system.is_ua_ability && !b.system.is_ua_ability) {
      return -1;
    }
    if (!a.system.is_ua_ability && b.system.is_ua_ability) {
      return 1;
    }

    // Sort by remaining criteria
    return WickedHelpers.specialAbilitySort(a, b);
  }

  static specialAbilitySort(a, b) {

    if (!WickedHelpers.isPrimalCalling(a.system.source) && WickedHelpers.isPrimalCalling(b.system.source)) {
      return -1;
    }
    if (WickedHelpers.isPrimalCalling(a.system.source) && !WickedHelpers.isPrimalCalling(b.system.source)) {
      return 1;
    }

    if (a.system.source < b.system.source) {
      return -1;
    }
    if (a.system.source > b.system.source) {
      return 1;
    }

    if ((a.system.ability_group == "group_core") && !(b.system.ability_group == "group_core")) {
      return -1;
    }
    if (!(a.system.ability_group == "group_core") && (b.system.ability_group == "group_core")) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }

    // names must be equal
    return 0;
  }


  /* -------------------------------------------- */

  /**
   * Sorts Tier-3 Rooms by Theme and then Alphabet
   */
  static tierThreeRoomSort(a, b) {
    if (a.system.theme < b.system.theme) {
      return -1;
    }
    if (a.system.theme > b.system.theme) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }

    // names must be equal
    return 0;
  }

  /* -------------------------------------------- */

  /**
   * Sorts Monster Races by Primal Type and then Alphabet
   */
  static monsterRaceSort(a, b) {
    if (!a.system.primal && b.system.primal) {
      return -1;
    }
    if (a.system.primal && !b.system.primal) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }

    // names must be equal
    return 0;
  }

  /* -------------------------------------------- */

  /**
   * Sorts Minion Upgrades by Type and then Alphabet
   */
  static minionUpgradeSort(a, b) {

    if ((a.system.upgrade_type == "regular") && !(b.system.upgrade_type == "regular")) {
      return -1;
    }
    if (!(a.system.upgrade_type == "regular") && (b.system.upgrade_type == "regular")) {
      return 1;
    }

    if ((a.system.upgrade_type == "path") && !(b.system.upgrade_type == "path")) {
      return -1;
    }
    if (!(a.system.upgrade_type == "path") && (b.system.upgrade_type == "path")) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }

    // names must be equal
    return 0;
  }

  /* -------------------------------------------- */

  /**
   * Sorts Conquest Abilities by Domain, Core and then Alphabet
   */
  static conquestAbilitySort(a, b) {

    if (a.system.domain < b.system.domain) {
      return -1;
    }

    if (a.system.domain > b.system.domain) {
      return 1;
    }

    if (!(a.system.is_core) && (b.system.is_core)) {
      return 1;
    }

    if ((a.system.is_core) && !(b.system.is_core)) {
      return -1;
    }

    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }

    // names must be equal
    return 0;
  }

  /* -------------------------------------------- */

}