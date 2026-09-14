const ownClubId = "UB";
const STORAGE_KEY = "ulftseBoysLiveMatchState_v1";

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
let currentFallbackMediaPath = null;

let lastGoal = null;
let ownGoals = [];
let nextGoalId = 1;


document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  fillTeamDropdowns();
  loadOwnClubPlayers();

  restoreMatchState();

  updateTeamNames();
  updateScore();
  updateUnknownGoalReminder();
  updateEndResetButton();
  restoreMessagePreview();
  updateStatusFromMatchState();

  startTimerDisplay();

  updateClock();
  setInterval(updateClock, 1000);
});


/* ========================================
   DATA LADEN
======================================== */

async function loadData() {
  const teamsResponse = await fetch("data/teams.json");
  teams = await teamsResponse.json();

  const playersResponse = await fetch("data/players.json");
  players = await playersResponse.json();
}


/* ========================================
   LOKALE OPSLAG
======================================== */

function saveMatchState() {
  const matchType = document.getElementById("matchType")?.value || "voorbereiding";
  const teamA = document.getElementById("teamA")?.value || "";
  const teamB = document.getElementById("teamB")?.value || "";

  const state = {
    matchType,
    teamA,
    teamB,
    scoreA,
    scoreB,
    matchStatus,
    firstHalfStartedAt,
    secondHalfStartedAt,
    pausedMinute,
    currentMessage,
    currentPhotoPath,
    currentFallbackMediaPath,
    lastGoal,
    ownGoals,
    nextGoalId
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


function restoreMatchState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return;
  }

  try {
    const state = JSON.parse(raw);

    if (!state || typeof state !== "object") {
      return;
    }

    const matchTypeSelect = document.getElementById("matchType");

    if (state.matchType && matchTypeSelect) {
      matchTypeSelect.value = state.matchType;
      fillTeamDropdowns();
    }

    const teamASelect = document.getElementById("teamA");
    const teamBSelect = document.getElementById("teamB");

    if (state.teamA && teamASelect) {
      teamASelect.value = state.teamA;
    }

    if (state.teamB && teamBSelect) {
      teamBSelect.value = state.teamB;
    }

    preventSameTeams("teamA");

    scoreA = Number.isFinite(state.scoreA) ? state.scoreA : 0;
    scoreB = Number.isFinite(state.scoreB) ? state.scoreB : 0;

    matchStatus = state.matchStatus || "not_started";
    firstHalfStartedAt = state.firstHalfStartedAt || null;
    secondHalfStartedAt = state.secondHalfStartedAt || null;
    pausedMinute = Number.isFinite(state.pausedMinute) ? state.pausedMinute : 0;

    currentMessage = state.currentMessage || "";
    currentPhotoPath = state.currentPhotoPath || null;
    currentFallbackMediaPath = state.currentFallbackMediaPath || null;

    lastGoal = state.lastGoal || null;
    ownGoals = Array.isArray(state.ownGoals) ? state.ownGoals : [];
    nextGoalId = Number.isFinite(state.nextGoalId) ? state.nextGoalId : 1;

    updateTeamNames();
  } catch (error) {
    console.error("Opgeslagen wedstrijd kon niet worden hersteld:", error);
  }
}


function clearMatchState() {
  localStorage.removeItem(STORAGE_KEY);
}


/* ========================================
   TEAMS
======================================== */

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

  const firstOpponentIndex = filteredTeams.findIndex(t => t.id !== ownClubId);

  if (firstOpponentIndex >= 0) {
    teamB.selectedIndex = firstOpponentIndex;
  }

  preventSameTeams("teamA");
  updateTeamNames();

  if (matchType) {
    matchType.onchange = () => {
      fillTeamDropdowns();
      saveMatchState();
    };
  }

  teamA.onchange = () => {
    preventSameTeams("teamA");
    updateTeamNames();
    saveMatchState();
  };

  teamB.onchange = () => {
    preventSameTeams("teamB");
    updateTeamNames();
    saveMatchState();
  };
}


function preventSameTeams(changedSelectId) {
  const teamA = document.getElementById("teamA");
  const teamB = document.getElementById("teamB");

  if (!teamA || !teamB) {
    return;
  }

  if (teamA.value !== teamB.value) {
    return;
  }

  const changedSelect = document.getElementById(changedSelectId);
  const otherSelect = changedSelectId === "teamA" ? teamB : teamA;

  for (let i = 0; i < otherSelect.options.length; i++) {
    if (otherSelect.options[i].value !== changedSelect.value) {
      otherSelect.selectedIndex = i;
      break;
    }
  }
}


function updateTeamNames() {
  document.getElementById("teamAName").textContent = getTeamName("teamA");
  document.getElementById("teamBName").textContent = getTeamName("teamB");
}


function getTeamName(selectId) {
  const teamId = document.getElementById(selectId)?.value;
  const team = teams.find(t => t.id === teamId);

  return team ? team.naam : "";
}


/* ========================================
   SPELERS
======================================== */

function loadOwnClubPlayers() {
  const ownClubPlayers = players.filter(p => p.teamId === ownClubId);

  fillGoalScorerSelect("playerSelect", ownClubPlayers);
  fillPlayerSelect("playerOut", ownClubPlayers);
  fillPlayerSelect("playerIn", ownClubPlayers);
  fillPlayerSelect("assignPlayerSelect", ownClubPlayers);
}


function fillGoalScorerSelect(elementId, playerList) {
  const select = document.getElementById(elementId);
  select.innerHTML = "";

  select.add(new Option("Onbekend", ""));

  playerList.forEach(player => {
    select.add(new Option(player.naam, player.id));
  });

  select.value = "";
}


function fillPlayerSelect(elementId, playerList) {
  const select = document.getElementById(elementId);
  select.innerHTML = "";

  playerList.forEach(player => {
    select.add(new Option(player.naam, player.id));
  });
}


function getSelectedPlayer(selectId) {
  const playerId = document.getElementById(selectId).value;

  if (!playerId) {
    return null;
  }

  return players.find(p => p.id === playerId) || null;
}


function resetGoalScorerSelect() {
  const select = document.getElementById("playerSelect");

  if (select) {
    select.value = "";
  }
}


/* ========================================
   WEDSTRIJD GESTART
======================================== */

function startMatch() {
  scoreA = 0;
  scoreB = 0;

  lastGoal = null;
  ownGoals = [];
  nextGoalId = 1;

  resetGoalScorerSelect();
  updateUnknownGoalReminder();

  updateScore();

  firstHalfStartedAt = Date.now();
  secondHalfStartedAt = null;
  pausedMinute = 0;
  matchStatus = "first_half";

  setStatus("1e helft loopt");
  updateEndResetButton();

  createMessage(
`⚽ De wedstrijd tussen ${getTeamName("teamA")} - ${getTeamName("teamB")} is gestart! 🔥

Succes Boys! 🔴⚪🔵`
  );

  saveMatchState();
}


/* ========================================
   RUST
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

  saveMatchState();
}


/* ========================================
   START TWEEDE HELFT
======================================== */

function startSecondHalf() {
  secondHalfStartedAt = Date.now();
  matchStatus = "second_half";

  setStatus("2e helft loopt");

  createMessage(
`⚽ We zijn begonnen met de tweede helft! 🔥

Kom op Boys! 🔴⚪🔵`
  );

  saveMatchState();
}


/* ========================================
   EINDE WEDSTRIJD
======================================== */

function endMatch() {
  pausedMinute = getCurrentMinute();
  matchStatus = "ended";

  setStatus("Afgelopen");
  updateEndResetButton();

  createMessage(
`🏁 Einde wedstrijd!

De eindstand van de wedstrijd ${getTeamName("teamA")} - ${getTeamName("teamB")} is ${scoreA}-${scoreB}.

Bedankt voor het volgen van de wedstrijd via ons kanaal en hopelijk tot de volgende keer!

Blijf ons via het kanaal volgen voor alle actuele nieuwtjes en tussenstanden rondom ons eerste elftal. 🔴⚪🔵`
  );

  saveMatchState();

  document.getElementById("endMatchDialog").showModal();
}


async function shareEndMessage() {
  closeEndMatchDialog();
  await shareWhatsApp();
}


function closeEndMatchDialog() {
  const dialog = document.getElementById("endMatchDialog");

  if (dialog.open) {
    dialog.close();
  }
}


function finishAndResetMatch() {
  closeEndMatchDialog();
  resetMatch(true);
}


function updateEndResetButton() {
  const endResetButton = document.getElementById("endResetButton");
  const resetButton = document.getElementById("resetButton");

  if (matchStatus === "ended") {
    if (endResetButton) {
      endResetButton.classList.remove("hidden");
    }

    if (resetButton) {
      resetButton.classList.add("hidden");
    }
  } else {
    if (endResetButton) {
      endResetButton.classList.add("hidden");
    }

    if (resetButton) {
      resetButton.classList.remove("hidden");
    }
  }
}


/* ========================================
   ULFTSE BOYS-GOAL REGISTREREN
======================================== */

function registerOwnGoal(minute, player) {
  const goal = {
    id: nextGoalId++,
    minute,
    minuteText: formatMatchMinute(minute),
    scoreA,
    scoreB,
    playerId: player ? player.id : null,
    playerName: player ? player.naam : null
  };

  ownGoals.push(goal);
  updateUnknownGoalReminder();

  return goal;
}


function getOwnScore() {
  const teamAId = document.getElementById("teamA").value;
  return teamAId === ownClubId ? scoreA : scoreB;
}


function getOpponentScore() {
  const teamAId = document.getElementById("teamA").value;
  return teamAId === ownClubId ? scoreB : scoreA;
}


function getGoalMediaForPlayer(player) {
  if (!player) {
    return {
      primary: null,
      fallback: null
    };
  }

  const ownScore = getOwnScore();
  const opponentScore = getOpponentScore();

  if (ownScore >= opponentScore) {
    return {
      primary: normalizeMediaPath(player.gif),
      fallback: normalizeMediaPath(player.foto)
    };
  }

  return {
    primary: normalizeMediaPath(player.foto),
    fallback: null
  };
}


function normalizeMediaPath(value) {
  if (!value || value === "null" || value === "undefined") {
    return null;
  }

  return value;
}


/* ========================================
   GOAL THUIS
======================================== */

function goalTeamA() {
  const teamAId = document.getElementById("teamA").value;
  const minute = getCurrentMinute();

  lastGoal = {
    previousScoreA: scoreA,
    previousScoreB: scoreB,
    ownGoalId: null
  };

  if (teamAId === ownClubId) {
    const player = getSelectedPlayer("playerSelect");

    scoreA++;
    updateScore();

    const goal = registerOwnGoal(minute, player);
    lastGoal.ownGoalId = goal.id;

    if (player) {
      const media = getGoalMediaForPlayer(player);

      createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}

⚽ ${player.naam}`,
        media.primary,
        media.fallback
      );
    } else {
      createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
      );
    }

    resetGoalScorerSelect();
    saveMatchState();
    return;
  }

  scoreA++;
  updateScore();

  createMessage(
`⚽ Goal ${getTeamName("teamA")}

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
  );

  saveMatchState();
}


/* ========================================
   GOAL UIT
======================================== */

function goalTeamB() {
  const teamBId = document.getElementById("teamB").value;
  const minute = getCurrentMinute();

  lastGoal = {
    previousScoreA: scoreA,
    previousScoreB: scoreB,
    ownGoalId: null
  };

  if (teamBId === ownClubId) {
    const player = getSelectedPlayer("playerSelect");

    scoreB++;
    updateScore();

    const goal = registerOwnGoal(minute, player);
    lastGoal.ownGoalId = goal.id;

    if (player) {
      const media = getGoalMediaForPlayer(player);

      createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}

⚽ ${player.naam}`,
        media.primary,
        media.fallback
      );
    } else {
      createMessage(
`⚽🔥 GOOOAAALLL ULFTSE BOYS!!!

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
      );
    }

    resetGoalScorerSelect();
    saveMatchState();
    return;
  }

  scoreB++;
  updateScore();

  createMessage(
`⚽ Goal ${getTeamName("teamB")}

${formatMatchMinute(minute)} | ${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
  );

  saveMatchState();
}


/* ========================================
   ONBEKENDE GOALS
======================================== */

function getUnknownGoals() {
  return ownGoals.filter(goal => !goal.playerId);
}


function updateUnknownGoalReminder() {
  const reminder = document.getElementById("unknownGoalReminder");
  const reminderText = document.getElementById("unknownGoalReminderText");

  if (!reminder || !reminderText) {
    return;
  }

  const unknownGoals = getUnknownGoals();

  if (unknownGoals.length === 0) {
    reminder.classList.add("hidden");
    reminderText.textContent = "";
    return;
  }

  reminder.classList.remove("hidden");

  if (unknownGoals.length === 1) {
    reminderText.textContent = "1 doelpunt zonder doelpuntenmaker";
  } else {
    reminderText.textContent = `${unknownGoals.length} doelpunten zonder doelpuntenmaker`;
  }
}


/* ========================================
   DOELPUNTENMAKER LATER TOEWIJZEN
======================================== */

function openAssignGoalDialog() {
  const unknownGoals = getUnknownGoals();

  if (unknownGoals.length === 0) {
    alert("Er zijn geen doelpunten zonder doelpuntenmaker.");
    return;
  }

  const goalSelect = document.getElementById("unknownGoalSelect");
  goalSelect.innerHTML = "";

  unknownGoals.forEach(goal => {
    const label = `${goal.minuteText} | ${goal.scoreA}-${goal.scoreB} | Onbekend`;
    goalSelect.add(new Option(label, goal.id));
  });

  const playerSelect = document.getElementById("assignPlayerSelect");

  if (playerSelect && playerSelect.options.length > 0) {
    playerSelect.selectedIndex = 0;
  }

  document.getElementById("assignGoalDialog").showModal();
}


function closeAssignGoalDialog() {
  document.getElementById("assignGoalDialog").close();
}


function assignGoalScorer() {
  const goalId = Number(document.getElementById("unknownGoalSelect").value);
  const player = getSelectedPlayer("assignPlayerSelect");

  if (!goalId) {
    alert("Kies eerst een doelpunt.");
    return;
  }

  if (!player) {
    alert("Kies eerst een speler.");
    return;
  }

  const goal = ownGoals.find(goal => goal.id === goalId);

  if (!goal) {
    alert("Het doelpunt kon niet worden gevonden.");
    closeAssignGoalDialog();
    return;
  }

  goal.playerId = player.id;
  goal.playerName = player.naam;

  updateUnknownGoalReminder();
  closeAssignGoalDialog();

  createMessage(
`⚽ Doelpuntenmaker ${goal.scoreA}-${goal.scoreB}

De ${goal.scoreA}-${goal.scoreB} van Ulftse Boys werd gemaakt door ${player.naam}.`
  );

  saveMatchState();
}


/* ========================================
   LAATSTE GOAL ONGEDAAN MAKEN
======================================== */

function openUndoGoalDialog() {
  if (!lastGoal) {
    alert("Er is geen doelpunt om terug te draaien.");
    return;
  }

  document.getElementById("undoGoalDialog").showModal();
}


function closeUndoGoalDialog() {
  document.getElementById("undoGoalDialog").close();
}


function undoLastGoal(reason) {
  if (!lastGoal) {
    closeUndoGoalDialog();
    return;
  }

  scoreA = lastGoal.previousScoreA;
  scoreB = lastGoal.previousScoreB;

  updateScore();

  if (lastGoal.ownGoalId) {
    ownGoals = ownGoals.filter(goal => goal.id !== lastGoal.ownGoalId);
    updateUnknownGoalReminder();
  }

  lastGoal = null;
  closeUndoGoalDialog();

  if (reason === "disallowed") {
    createMessage(
`❌ Doelpunt afgekeurd

Nieuwe tussenstand:
${getTeamName("teamA")} - ${getTeamName("teamB")} | ${scoreA}-${scoreB}`
    );

    saveMatchState();
    return;
  }

  if (reason === "mistake") {
    currentMessage = "";
    currentPhotoPath = null;
    currentFallbackMediaPath = null;

    document.getElementById("messagePreview").textContent =
      "Laatste goal verwijderd wegens verkeerde invoer.";

    clearMediaPreview();
    saveMatchState();
  }
}


/* ========================================
   WISSEL ULFTSE BOYS
======================================== */

function substitution() {
  const outPlayer = getSelectedPlayer("playerOut");
  const inPlayer = getSelectedPlayer("playerIn");

  if (!outPlayer || !inPlayer) {
    alert("Kies speler eruit en speler erin.");
    return;
  }

  if (outPlayer.id === inPlayer.id) {
    alert("Speler eruit en erin mogen niet dezelfde speler zijn.");
    return;
  }

  const minute = getCurrentMinute();

  createMessage(
`🔄 ${formatMatchMinute(minute)} | Wissel Ulftse Boys

Erin: ${inPlayer.naam} ➡️
Eruit: ${outPlayer.naam} ⬅️`
  );

  saveMatchState();
}


/* ========================================
   RESET WEDSTRIJD
======================================== */

function resetMatch(skipConfirm = false) {
  if (!skipConfirm) {
    const confirmed = confirm("Weet je zeker dat je de wedstrijd wilt resetten?");

    if (!confirmed) {
      return;
    }
  }

  scoreA = 0;
  scoreB = 0;

  matchStatus = "not_started";

  firstHalfStartedAt = null;
  secondHalfStartedAt = null;
  pausedMinute = 0;

  currentMessage = "";
  currentPhotoPath = null;
  currentFallbackMediaPath = null;

  lastGoal = null;
  ownGoals = [];
  nextGoalId = 1;

  resetGoalScorerSelect();
  updateUnknownGoalReminder();
  updateEndResetButton();

  updateScore();
  setStatus("Nog niet gestart");

  document.getElementById("minute").textContent = "0'";
  document.getElementById("messagePreview").textContent = "Nog geen bericht.";

  clearMediaPreview();
  clearMatchState();
}


/* ========================================
   SCORE
======================================== */

function updateScore() {
  document.getElementById("scoreA").textContent = scoreA;
  document.getElementById("scoreB").textContent = scoreB;
}


function setStatus(text) {
  document.getElementById("status").textContent = text;
}


function updateStatusFromMatchState() {
  const statusMap = {
    not_started: "Nog niet gestart",
    first_half: "1e helft loopt",
    half_time: "Rust",
    second_half: "2e helft loopt",
    ended: "Afgelopen"
  };

  setStatus(statusMap[matchStatus] || "Nog niet gestart");
}


/* ========================================
   WEDSTRIJDKLOK
======================================== */

function startTimerDisplay() {
  const updateMinuteDisplay = () => {
    document.getElementById("minute").textContent = formatMatchMinute(getCurrentMinute());
  };

  updateMinuteDisplay();
  setInterval(updateMinuteDisplay, 1000);
}


function getCurrentRawMinute() {
  if (matchStatus === "not_started") {
    return 0;
  }

  if (matchStatus === "ended" || matchStatus === "half_time") {
    return pausedMinute;
  }

  if (matchStatus === "first_half") {
    if (!firstHalfStartedAt) {
      return pausedMinute || 0;
    }

    const diff = Date.now() - firstHalfStartedAt;

    return Math.max(1, Math.ceil(diff / 60000));
  }

  if (matchStatus === "second_half") {
    if (!secondHalfStartedAt) {
      return pausedMinute || 45;
    }

    const diff = Date.now() - secondHalfStartedAt;

    return 45 + Math.max(1, Math.ceil(diff / 60000));
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

  if ((matchStatus === "first_half" || matchStatus === "half_time") && minute > 45) {
    return `45+${minute - 45}'`;
  }

  if ((matchStatus === "second_half" || matchStatus === "ended") && minute > 90) {
    return `90+${minute - 90}'`;
  }

  return `${minute}'`;
}


/* ========================================
   BERICHT + MEDIA
======================================== */

function createMessage(text, mediaPath = null, fallbackMediaPath = null) {
  currentMessage = text;
  currentPhotoPath = normalizeMediaPath(mediaPath);
  currentFallbackMediaPath = normalizeMediaPath(fallbackMediaPath);

  document.getElementById("messagePreview").textContent = text;

  showMediaPreview(currentPhotoPath, currentFallbackMediaPath);
}


function restoreMessagePreview() {
  if (currentMessage) {
    document.getElementById("messagePreview").textContent = currentMessage;
    showMediaPreview(currentPhotoPath, currentFallbackMediaPath);
  } else {
    document.getElementById("messagePreview").textContent = "Nog geen bericht.";
    clearMediaPreview();
  }
}


function showMediaPreview(primaryPath, fallbackPath = null) {
  const wrap = document.getElementById("photoPreviewWrap");
  const img = document.getElementById("photoPreview");

  const primary = normalizeMediaPath(primaryPath);
  const fallback = normalizeMediaPath(fallbackPath);

  if (!primary && !fallback) {
    clearMediaPreview();
    return;
  }

  let triedFallback = false;

  img.onload = () => {
    wrap.classList.remove("hidden");
  };

  img.onerror = () => {
    if (!triedFallback && fallback && img.src !== new URL(fallback, window.location.href).href) {
      triedFallback = true;
      img.src = fallback;
      return;
    }

    clearMediaPreview();
  };

  img.src = primary || fallback;
  wrap.classList.remove("hidden");
}


function clearMediaPreview() {
  const wrap = document.getElementById("photoPreviewWrap");
  const img = document.getElementById("photoPreview");

  if (!wrap || !img) {
    return;
  }

  img.onload = null;
  img.onerror = null;
  img.src = "";
  wrap.classList.add("hidden");
}


/* ========================================
   DELEN VIA WHATSAPP
======================================== */

async function getShareableMediaFile(path) {
  const normalizedPath = normalizeMediaPath(path);

  if (!normalizedPath) {
    return null;
  }

  try {
    const response = await fetch(normalizedPath, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if (!blob.type || !blob.type.startsWith("image/")) {
      return null;
    }

    const filename = normalizedPath.split("/").pop() || "media";

    return new File([blob], filename, {
      type: blob.type
    });
  } catch (error) {
    console.warn("Media kon niet worden geladen:", normalizedPath, error);
    return null;
  }
}


async function shareWhatsApp() {
  if (!currentMessage) {
    alert("Maak eerst een bericht.");
    return;
  }

  try {
    let file = await getShareableMediaFile(currentPhotoPath);

    if (!file && currentFallbackMediaPath) {
      file = await getShareableMediaFile(currentFallbackMediaPath);
    }

    if (
      file &&
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      await navigator.share({
        text: currentMessage,
        files: [file]
      });

      return;
    }

    if (navigator.share) {
      await navigator.share({
        text: currentMessage
      });

      return;
    }

    await navigator.clipboard.writeText(currentMessage);

    alert("Bericht gekopieerd. Open WhatsApp en plak het bericht handmatig.");
  } catch (error) {
    if (error && error.name === "AbortError") {
      return;
    }

    console.error(error);

    try {
      await navigator.clipboard.writeText(currentMessage);
      alert("Delen lukte niet. Het bericht is gekopieerd.");
    } catch (clipboardError) {
      console.error(clipboardError);
      alert("Delen lukte niet. Kopieer het bericht handmatig uit de preview.");
    }
  }
}


/* ========================================
   DATUM + LIVE KLOK
======================================== */

function updateClock() {
  const currentDateElement = document.getElementById("currentDate");
  const currentClockElement = document.getElementById("currentClock");

  if (!currentDateElement || !currentClockElement) {
    return;
  }

  const now = new Date();

  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  let dateString = now.toLocaleDateString("nl-NL", dateOptions);

  dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  currentDateElement.textContent = dateString;
  currentClockElement.textContent = now.toLocaleTimeString("nl-NL");
}
