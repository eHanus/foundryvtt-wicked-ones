/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and ChatMessages
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  const version = game.system.version;
  ui.notifications.info(`Applying Wicked Ones system migration for version ${version}. Please be patient and do not close your game or shut down your server.`, { permanent: true });

  // 1. Migrate World Actors (and their embedded Items)
  for (let actor of game.actors) {
    try {
      const updateData = _migrateDocumentFlags(actor);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Wicked Ones | Migrating Actor document ${actor.name}`);
        await actor.update(updateData);
      }

      for (let item of actor.items) {
        const itemUpdate = _migrateDocumentFlags(item);
        if (!foundry.utils.isEmpty(itemUpdate)) {
          await item.update(itemUpdate);
        }
      }
    } catch (err) {
      console.error(`Wicked Ones | Failed to migrate Actor ${actor.name}:`, err);
    }
  }

  // 2. Migrate World Items
  for (let item of game.items) {
    try {
      const updateData = _migrateDocumentFlags(item);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Wicked Ones | Migrating Item document ${item.name}`);
        await item.update(updateData);
      }
    } catch (err) {
      console.error(`Wicked Ones | Failed to migrate Item ${item.name}:`, err);
    }
  }

  // 3. Migrate legacy pre-V12 ChatMessages so their roll cards display in V14 without errors
  const messageUpdates = [];
  for (let msg of game.messages) {
    const rawRolls = msg._source?.rolls ?? [];
    if (!rawRolls.length) continue;

    let needsUpdate = false;
    const migratedRolls = [];

    for (let r of rawRolls) {
      try {
        const parsed = typeof r === "string" ? foundry.utils.deepClone(JSON.parse(r)) : foundry.utils.deepClone(r);

        // Check if this roll triggers the V14 Roll.fromData 'class' error
        if (!parsed || !Array.isArray(parsed.terms)) {
          needsUpdate = true;
          continue; // Drop unparseable roll object, preserving msg.content HTML
        }

        let termPatched = false;
        for (let term of parsed.terms) {
          if (term && !term.class) {
            // Legacy Wicked Ones rolls are always d6 pools (Die terms)
            term.class = "Die";
            termPatched = true;
          }
        }

        if (termPatched) needsUpdate = true;

        // Verify that Foundry V14's Roll.fromData accepts the patched roll
        Roll.fromData(parsed);
        migratedRolls.push(JSON.stringify(parsed));
      } catch (err) {
        // If Roll.fromData still rejects the legacy structure, omit the roll data
        // so the pre-rendered HTML in msg.content still displays cleanly in chat
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      messageUpdates.push({
        _id: msg.id,
        rolls: migratedRolls
      });
    }
  }

  if (messageUpdates.length > 0) {
    console.log(`Wicked Ones | Adapting ${messageUpdates.length} legacy chat roll messages for V14 compatibility.`);
    await ChatMessage.updateDocuments(messageUpdates);
  }

  // Set the migration as complete
  await game.settings.set("wicked-ones", "systemMigrationVersion", 1.2);
  ui.notifications.info(`Wicked Ones System Migration to version ${version} completed!`, { permanent: true });
};

/**
 * Fix legacy "wicked.*" sheetClass flags so sheets open under "wicked-ones.*" in V14
 * @param {Document} doc   The Actor or Item document to inspect
 * @return {Object}        The updateData to apply
 */
function _migrateDocumentFlags(doc) {
  let updateData = {};
  const sheetClass = doc._source?.flags?.core?.sheetClass;
  if (typeof sheetClass === "string" && sheetClass.startsWith("wicked.")) {
    updateData["flags.core.sheetClass"] = sheetClass.replace(/^wicked\./, "wicked-ones.");
  }
  return updateData;
}