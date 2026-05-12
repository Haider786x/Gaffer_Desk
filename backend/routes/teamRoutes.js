const Express = require("express");
const router = Express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");
router.post("/", createTeam);
router.get("/", getTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);
module.exports = router;
