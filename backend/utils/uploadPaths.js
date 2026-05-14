const path = require("path");
const fs = require("fs");

/**
 * Delete a file stored under backend/ from a public URL like `/uploads/teams/x.png`
 */
function unlinkPublicUpload(publicUrl) {
  if (
    !publicUrl ||
    typeof publicUrl !== "string" ||
    !publicUrl.startsWith("/uploads/")
  ) {
    return;
  }
  const rel = publicUrl.replace(/^\//, "");
  const fullPath = path.join(__dirname, "..", rel);
  fs.unlink(fullPath, () => {});
}

module.exports = { unlinkPublicUpload };
