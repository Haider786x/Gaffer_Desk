const Express = require("express");
const router = Express.Router();
const {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");
router.post("/:teamId/players", createPlayer);
router.get("/:teamId/players", getPlayersByTeam);
router.get("/:id", getPlayerById);
router.put("/:id", updatePlayer);
router.delete("/:id", deletePlayer);

module.exports = router;
