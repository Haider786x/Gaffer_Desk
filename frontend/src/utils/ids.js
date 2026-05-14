/**
 * Stable id string for API/Mongo payloads that use either `id` or `_id`.
 */
export function entityId(entity) {
  if (entity == null || typeof entity !== "object") return "";
  if (entity.id != null && entity.id !== "") return String(entity.id);
  if (entity._id != null && entity._id !== "") return String(entity._id);
  return "";
}
