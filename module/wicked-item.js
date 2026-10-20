/**
 * Extend the basic Item
 * @extends {Item}
 */
export class WickedItem extends Item {

  /**
   * Fill new empty hirelings with random data
   * @override
   **/
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (this.type == "adventurer") {
      if (this.system?.adventurer_type == "hireling" && this.system?.hireling_type == "") {
        const hirelingType = this.getRandomHirelingType();
        const i18n = game.i18n.localize(hirelingType);

        this.updateSource({
          name: i18n,
          system: {
            hireling_type: hirelingType,
            hireling_type_custom: i18n
          }
        });
      }
    }
  }

  // Helper for random hireling types
  getRandomHirelingType() {
    return Object.values(CONFIG.WO.hireling_types)[Math.floor(Math.random() * Object.values(CONFIG.WO.hireling_types).length)] ?? "";
  }

  /**
   * Create a new entity using provided input data
   * @override
   */
  static async create(data, options = {}) {
    if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).includes("type")) {

      // Replace default image
      let path = `systems/wicked-ones/styles/assets/icons/`;
      switch (data.type) {
        case "adventurer":
          path += 'Icon.1_05';
          break;
        case "awakened_type":
          path += 'Icon.1_57';
          break;
        case "calling":
          path += 'Icon.1_66';
          break;
        case "conquest_ability":
          path += 'Icon.2_57';
          break;
        case "defense":
          path += 'Icon.1_04';
          break;
        case "dungeon_theme":
          path += 'Icon.3_67';
          break;
        case "duty":
          path += 'Icon.5_85';
          break;
        case "gearsupply":
          path += 'Icon.6_37';
          break;
        case "goldmonger_type":
          path += 'Icon.5_16';
          break;
        case "invasion":
          path += 'Icon.6_01';
          break;
        case "minionimpulse":
          path += 'Icon.2_29';
          break;
        case "minion_type":
          path += 'Icon.6_62';
          break;
        case "minion_upgrade":
          path += 'Icon.7_96';
          break;
        case "monster_race":
          path += 'Icon.3_37';
          break;
        case "project":
          path += 'Icon.7_53';
          break;
        case "revelry":
          path += 'Icon.4_48';
          break;
        case "specialability":
          path += 'Icon.5_34';
          break;
        case "tier3room":
          path += 'Icon.5_70';
          break;
        case "wickedimpulse":
          path += 'Icon.6_25';
          break;
        default:
          path = "";
      }
      if (path != "") {
        data.img = data.img || path + `.png`;
      }

    }
    return await super.create(data, options);
  }

  /* override */
  prepareData() {
    super.prepareData();
    // Code to override data-preparation for items
  }

  /* override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type == "specialability") {
      switch (this.system.ability_type) {
        case "ds_eyes":
          for (var j = 1; j < 10; j++) {
            this.system.primal['ds_eye_ray_' + j + '_name'] = game.i18n.localize(CONFIG.WO.doomseeker_eye_rays[this.system.primal['ds_eye_ray_' + j]] + '.Name');
            this.system.primal['ds_eye_ray_' + j + '_tooltip'] = game.i18n.localize(CONFIG.WO.doomseeker_eye_rays[this.system.primal['ds_eye_ray_' + j]] + '.Tooltip');
          }
          break;
        default:
      }
    }
  }

}