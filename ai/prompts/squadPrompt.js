const buildSquadPrompt = (team) => {
  return `
You are an elite football director, scout, tactical analyst, and transfer expert.

Analyze this FIFA Career Mode squad.

========================
TEAM INFORMATION
========================

Team Name: ${team.name}

Country: ${team.country}

Formation: ${team.formation}

Average Rating: ${team.avgOverallRating}

League: ${team.league || "Unknown"}

========================
PLAYERS
========================

${team.players
  .map(
    (player) => `
--------------------------------
Name: ${player.name}

Age: ${player.age}

Position: ${player.position}

Overall Rating: ${player.overallRating}

Potential Rating: ${player.potentialRating}

Preferred Foot: ${player.preferredFoot}

Nationality: ${player.nationality}

Attributes:
- Pace: ${player.pace}
- Shooting: ${player.shooting}
- Passing: ${player.passing}
- Dribbling: ${player.dribbling}
- Defense: ${player.defense}
- Physical: ${player.physical}
`,
  )
  .join("\n")}

========================
TASKS
========================

1. Identify the best players.
2. Identify weak positions.
3. Suggest players to SELL.
4. Suggest players to KEEP.
5. Suggest young talents to build around.
6. Suggest tactical improvements.
7. Suggest ideal transfers.
8. Suggest rebuild strategy.
9. Evaluate if formation suits squad.
10. Predict long-term squad future.

Give detailed football reasoning.
`;
};

module.exports = buildSquadPrompt;
