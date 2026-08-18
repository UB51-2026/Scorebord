const ownClubId = "UB";

let teams = [];
let players = [];

let scoreA = 0;
let scoreB = 0;

let matchStatus = "not_started";
let firstHalfStartedAt = null;
let secondHalfStartedAt = null;
let pausedMinute = 0;

let currentMessage = "";
let currentPhotoPath = null;

// Onthoudt de laatste goal zodat deze kan worden teruggedraaid
let lastGoal = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  fillTeamDropdowns();
  updateTeamNames();
  loadOwnClubPlayers();
  startTimerDisplay();

  updateClock();
  setInterval(updateClock, 1000);
});

async function loadData() {
  const teamsResponse = await fetch("data/teams.json");
  teams = await teamsResponse.json();

  const playersResponse = await fetch("data/players.json");
  players = await playersResponse.json();
}

function fillTeamDropdowns() {
  const teamA = document.getElementById("teamA");
  const teamB = document.getElementById("teamB");
  const matchType = document.getElementById("matchType");

  teamA.innerHTML = "";
  teamB.innerHTML = "";

  const selectedType = matchType ? matchType.value : "voorbereiding";

  const filteredTeams = teams.filter(team =>
    team.types && team.types.includes(selectedType)
  );

  filteredTeams.forEach(team => {
    teamA.add(new Option(team.naam, team.id));
    teamB.add(new Option(team.naam, team.id));
  });

  const ownIndex = filteredTeams.findIndex(t => t.id === ownClubId);

  if (ownIndex >= 0) {
    teamA.selectedIndex = ownIndex;
  }

  const firstOpponentIndex = filteredTeams.findIndex(
    t => t.id !== ownClubId
  );

  if (firstOpponentIndex >= 0) {
    teamB.selectedIndex = firstOpponentIndex;
  }

  preventSameTeams("teamA");
  updateTeamNames();

  if (matchType) {
    matchType.onchange = fillTeamDropdowns;
  }

  teamA.onchange = () => {
    preventSameTeams("teamA");
    updateTeamNames();
  };

  teamB.onchange = () => {
    preventSameTeams("teamB");
    updateTeamNames();
  };
}

function preventSameTeams(changedSelectId) {
  const teamA = document.getElementById("teamA");
  const teamB = document.getElementById("teamB");

  if (!teamA || !teamB) return;
  if (teamA.value !== teamB.value) return;

  const changedSelect = document.getElementById(changedSelectId);
  const otherSelect =
    changedSelectId === "teamA" ? teamB : teamA;

  for (let i = 0; i < otherSelect.options.length; i++) {
    if (otherSelect.options[i].value !== changedSelect.value) {
      otherSelect.selectedIndex = i;
      break;
    }
  }
}

function updateTeamNames() {
  document.getElementById("teamAName").textContent =
    getTeamName("teamA");

  document.getElementById("teamBName").textContent =
    getTeamName("teamB");
}

function loadOwnClubPlayers() {
  const ownClubPlayers = players.filter(
    p => p.teamId === ownClubId
  );

  fillPlayerSelect("playerSelect", ownClubPlayers);
  fillPlayerSelect("playerOut", ownClubPlayers);
  fillPlayerSelect("playerIn", ownClubPlayers);
}

function fillPlayerSelect(elementId, playerList) {
  const select = document.getElementById(elementId);

  select.innerHTML = "";

  playerList.forEach(player => {
    select.add(
      new Option(player.naam, player.id)
    );
  });
}

function getTeamName(selectId) {
  const teamId =
    document.getElementById(selectId).value;

  const team = teams.find(
    t => t.id === teamId
  );

  return team ? team.naam : "";
}

function getSelectedPlayer(selectId) {
  const playerId =
    document.getElementById(selectId).value;

  return players.find(
    p => p.id === playerId
  );
}

/* ========================================
   1. WEDSTRIJD GESTART
======================================== */

function startMatch() {
  scoreA = 0;
  scoreB = 0;
  lastGoal = null;

  updateScore();

  firstHalfStartedAt = Date.now();
  secondHalfStartedAt = null;
  pausedMinute = 0;
  matchStatus = "first_half";

  setStatus("1e helft loopt");

  createMessage(
`⚽ De wedstrijd tussen ${getTeamName("teamA")} - ${getTeamName("teamB")} is gestart! 🔥

Succes Boys! 🔴⚪🔵`
  );
}

/* ========================================
   4. RUST
======================================== */

function halfTime() {
  pausedMinute = getCurrentMinute();
  matchStatus = "half_time";

  setStatus("Rust");

  createMessage(
`⏸️ Het is rust.

Tussenstand:
${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
  );
}

/* ========================================
   5. START TWEEDE HELFT
======================================== */

function startSecondHalf() {
  secondHalfStartedAt = Date.now();
  matchStatus = "second_half";

  setStatus("2e helft loopt");

  createMessage(
`⚽ We zijn begonnen met de tweede helft! 🔥

Kom op Boys! 🔴⚪🔵`
  );
}

/* ========================================
   6. EINDE WEDSTRIJD
======================================== */

function endMatch() {
  pausedMinute = getCurrentMinute();
  matchStatus = "ended";

  setStatus("Afgelopen");

  createMessage(
`🏁 Einde wedstrijd!

De eindstand van de wedstrijd ${getTeamName("teamA")} - ${getTeamName("teamB")} is ${scoreA}-${scoreB}.

Bedankt voor het volgen van de wedstrijd via ons kanaal en hopelijk tot de volgende keer!

Blijf ons via het kanaal volgen voor alle actuele nieuwtjes en tussenstanden rondom ons eerste elftal. 🔴⚪🔵`
  );
}

/* ========================================
   GOAL THUIS
======================================== */

function goalTeamA() {
  const teamAId =
    document.getElementById("teamA").value;

  const minute = getCurrentMinute();

  // Bewaar de stand VOOR de goal
  lastGoal = {
    previousScoreA: scoreA,
    previousScoreB: scoreB
  };

  /*
   * Ulftse Boys is thuis
   */
  if (teamAId === ownClubId) {
    const player =
      getSelectedPlayer("playerSelect");

    if (!player) {
      lastGoal = null;
      alert("Kies eerst een speler.");
      return;
    }

    scoreA++;
    updateScore();

    createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}

⚽ ${player.naam}`,
      player.foto
    );

    return;
  }

  /*
   * Tegenstander is thuis
   */
  scoreA++;
  updateScore();

  createMessage(
`⚽ Goal ${getTeamName("teamA")}

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
  );
}

/* ========================================
   GOAL UIT
======================================== */

function goalTeamB() {
  const teamBId =
    document.getElementById("teamB").value;

  const minute = getCurrentMinute();

  // Bewaar de stand VOOR de goal
  lastGoal = {
    previousScoreA: scoreA,
    previousScoreB: scoreB
  };

  /*
   * Ulftse Boys is uit
   */
  if (teamBId === ownClubId) {
    const player =
      getSelectedPlayer("playerSelect");

    if (!player) {
      lastGoal = null;
      alert("Kies eerst een speler.");
      return;
    }

    scoreB++;
    updateScore();

    createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}

⚽ ${player.naam}`,
      player.foto
    );

    return;
  }

  /*
   * Tegenstander is uit
   */
  scoreB++;
  updateScore();

  createMessage(
`⚽ Goal ${getTeamName("teamB")}

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
  );
}

/* ========================================
   LAATSTE GOAL ONGEDAAN MAKEN
======================================== */

function openUndoGoalDialog() {
  if (!lastGoal) {
    alert("Er is geen doelpunt om terug te draaien.");
    return;
  }

  document
    .getElementById("undoGoalDialog")
    .showModal();
}

function closeUndoGoalDialog() {
  document
    .getElementById("undoGoalDialog")
    .close();
}

function undoLastGoal(reason) {
  if (!lastGoal) {
    closeUndoGoalDialog();
    return;
  }

  // Herstel de stand van vóór de laatste goal
  scoreA = lastGoal.previousScoreA;
  scoreB = lastGoal.previousScoreB;

  updateScore();

  // Dezelfde goal kan niet nogmaals worden teruggedraaid
  lastGoal = null;

  closeUndoGoalDialog();

  /*
   * AFGEKEURD
   * Hiervoor maken we WEL een WhatsApp-bericht.
   */
  if (reason === "disallowed") {
    createMessage(
`❌ Doelpunt afgekeurd

Nieuwe tussenstand:
${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
    );

    return;
  }

  /*
   * VERKEERDE INVOER
   * Alleen score corrigeren.
   * Niets klaarzetten voor WhatsApp.
   */
  if (reason === "mistake") {
    currentMessage = "";
    currentPhotoPath = null;

    document.getElementById(
      "messagePreview"
    ).textContent =
      "Laatste goal verwijderd wegens verkeerde invoer.";

    document.getElementById(
      "photoPreview"
    ).src = "";

    document.getElementById(
      "photoPreviewWrap"
    ).classList.add("hidden");
  }
}

/* ========================================
   3. WISSEL ULFTSE BOYS
======================================== */

function substitution() {
  const outPlayer =
    getSelectedPlayer("playerOut");

  const inPlayer =
    getSelectedPlayer("playerIn");

  if (!outPlayer || !inPlayer) {
    alert(
      "Kies speler eruit en speler erin."
    );
    return;
  }

  if (outPlayer.id === inPlayer.id) {
    alert(
      "Speler eruit en erin mogen niet dezelfde speler zijn."
    );
    return;
  }

  const minute = getCurrentMinute();

  createMessage(
`🔄 ${formatMatchMinute(minute)} | Wissel Ulftse Boys

Erin: ${inPlayer.naam} ➡️
Eruit: ${outPlayer.naam} ⬅️`
  );
}

/* ========================================
   RESET WEDSTRIJD
======================================== */

function resetMatch() {
  if (
    !confirm(
      "Weet je zeker dat je de wedstrijd wilt resetten?"
    )
  ) {
    return;
  }

  scoreA = 0;
  scoreB = 0;

  matchStatus = "not_started";

  firstHalfStartedAt = null;
  secondHalfStartedAt = null;

  pausedMinute = 0;

  currentMessage = "";
  currentPhotoPath = null;
  lastGoal = null;

  updateScore();

  setStatus("Nog niet gestart");

  document.getElementById(
    "minute"
  ).textContent = "0'";

  document.getElementById(
    "messagePreview"
  ).textContent = "Nog geen bericht.";

  document.getElementById(
    "photoPreview"
  ).src = "";

  document.getElementById(
    "photoPreviewWrap"
  ).classList.add("hidden");
}

/* ========================================
   SCORE
======================================== */

function updateScore() {
  document.getElementById(
    "scoreA"
  ).textContent = scoreA;

  document.getElementById(
    "scoreB"
  ).textContent = scoreB;
}

function setStatus(text) {
  document.getElementById(
    "status"
  ).textContent = text;
}

/* ========================================
   WEDSTRIJDKLOK
======================================== */

function startTimerDisplay() {
  setInterval(() => {
    document.getElementById(
      "minute"
    ).textContent =
      `${formatMatchMinute(getCurrentMinute())}`;
  }, 1000);
}

function getCurrentRawMinute() {
  if (matchStatus === "not_started") {
    return 0;
  }

  if (
    matchStatus === "ended" ||
    matchStatus === "half_time"
  ) {
    return pausedMinute;
  }

  if (matchStatus === "first_half") {
    const diff =
      Date.now() - firstHalfStartedAt;

    return Math.max(
      1,
      Math.ceil(diff / 60000)
    );
  }

  if (matchStatus === "second_half") {
    const diff =
      Date.now() - secondHalfStartedAt;

    return (
      45 +
      Math.max(
        1,
        Math.ceil(diff / 60000)
      )
    );
  }

  return 0;
}

function getCurrentMinute() {
  return getCurrentRawMinute();
}

function formatMatchMinute(minute) {
  if (minute === 0) {
    return "0'";
  }

  if (
    matchStatus === "first_half" &&
    minute > 45
  ) {
    return `45+${minute - 45}'`;
  }

  if (
    matchStatus === "second_half" &&
    minute > 90
  ) {
    return `90+${minute - 90}'`;
  }

  return `${minute}'`;
}

/* ========================================
   BERICHT + SPELERSFOTO
======================================== */

function createMessage(
  text,
  photoPath = null
) {
  currentMessage = text;
  currentPhotoPath = photoPath;

  document.getElementById(
    "messagePreview"
  ).textContent = text;

  const wrap =
    document.getElementById(
      "photoPreviewWrap"
    );

  const img =
    document.getElementById(
      "photoPreview"
    );

  if (photoPath) {
    img.src = photoPath;

    wrap.classList.remove(
      "hidden"
    );
  } else {
    img.src = "";

    wrap.classList.add(
      "hidden"
    );
  }
}

/* ========================================
   DELEN VIA WHATSAPP
======================================== */

async function shareWhatsApp() {
  if (!currentMessage) {
    alert("Maak eerst een bericht.");
    return;
  }

  try {
    if (currentPhotoPath) {
      const response =
        await fetch(currentPhotoPath);

      const blob =
        await response.blob();

      const filename =
        currentPhotoPath
          .split("/")
          .pop();

      const file =
        new File(
          [blob],
          filename,
          { type: blob.type }
        );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file]
        })
      ) {
        await navigator.share({
          text: currentMessage,
          files: [file]
        });

        return;
      }
    }

    if (navigator.share) {
      await navigator.share({
        text: currentMessage
      });

      return;
    }

    await navigator.clipboard.writeText(
      currentMessage
    );

    alert(
      "Bericht gekopieerd. Open WhatsApp en plak het bericht handmatig."
    );

  } catch (error) {
    console.error(error);

    await navigator.clipboard.writeText(
      currentMessage
    );

    alert(
      "Delen lukte niet. Het bericht is gekopieerd."
    );
  }
}

/* ========================================
   DATUM + LIVE KLOK
======================================== */

function updateClock() {
  const currentDateElement =
    document.getElementById(
      "currentDate"
    );

  const currentClockElement =
    document.getElementById(
      "currentClock"
    );

  if (
    !currentDateElement ||
    !currentClockElement
  ) {
    return;
  }

  const now = new Date();

  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  let dateString =
    now.toLocaleDateString(
      "nl-NL",
      dateOptions
    );

  dateString =
    dateString
      .charAt(0)
      .toUpperCase() +
    dateString.slice(1);

  currentDateElement.textContent =
    dateString;

  currentClockElement.textContent =
    now.toLocaleTimeString("nl-NL");
}