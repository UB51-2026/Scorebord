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

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  fillTeamDropdowns();
  updateTeamNames();
  loadOwnClubPlayers();
  startTimerDisplay();
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

  teamA.innerHTML = "";
  teamB.innerHTML = "";

  teams.forEach(team => {
    teamA.add(new Option(team.naam, team.id));
    teamB.add(new Option(team.naam, team.id));
  });

  const ownIndex = teams.findIndex(t => t.id === ownClubId);
  if (ownIndex >= 0) teamA.selectedIndex = ownIndex;

  const firstOpponentIndex = teams.findIndex(t => t.id !== ownClubId);
  if (firstOpponentIndex >= 0) teamB.selectedIndex = firstOpponentIndex;

  teamA.addEventListener("change", updateTeamNames);
  teamB.addEventListener("change", updateTeamNames);
}

function updateTeamNames() {
  document.getElementById("teamAName").textContent = getTeamName("teamA");
  document.getElementById("teamBName").textContent = getTeamName("teamB");
}

function loadOwnClubPlayers() {
  const ownClubPlayers = players.filter(p => p.teamId === ownClubId);
  fillPlayerSelect("playerSelect", ownClubPlayers);
  fillPlayerSelect("playerOut", ownClubPlayers);
  fillPlayerSelect("playerIn", ownClubPlayers);
}

function fillPlayerSelect(elementId, playerList) {
  const select = document.getElementById(elementId);
  select.innerHTML = "";

  playerList.forEach(player => {
    select.add(new Option(player.naam, player.id));
  });
}

function getTeamName(selectId) {
  const teamId = document.getElementById(selectId).value;
  const team = teams.find(t => t.id === teamId);
  return team ? team.naam : "";
}

function getSelectedPlayer(selectId) {
  const playerId = document.getElementById(selectId).value;
  return players.find(p => p.id === playerId);
}

function startMatch() {
  scoreA = 0;
  scoreB = 0;
  updateScore();

  firstHalfStartedAt = Date.now();
  secondHalfStartedAt = null;
  pausedMinute = 0;
  matchStatus = "first_half";

  setStatus("1e helft loopt");

  createMessage(`⚽ WEDSTRIJD GESTART

${getTeamName("teamA")} - ${getTeamName("teamB")}

We zijn begonnen!`);
}

function halfTime() {
  pausedMinute = getCurrentMinute();
  matchStatus = "half_time";
  setStatus("Rust");

  createMessage(`⏸ RUST

${getTeamName("teamA")} - ${getTeamName("teamB")}
Tussenstand: ${scoreA} - ${scoreB}`);
}

function startSecondHalf() {
  secondHalfStartedAt = Date.now();
  matchStatus = "second_half";
  setStatus("2e helft loopt");

  createMessage(`▶ START 2E HELFT

${getTeamName("teamA")} - ${getTeamName("teamB")}
Tussenstand: ${scoreA} - ${scoreB}`);
}

function endMatch() {
  pausedMinute = getCurrentMinute();
  matchStatus = "ended";
  setStatus("Afgelopen");

  createMessage(`🏁 EINDE WEDSTRIJD

${getTeamName("teamA")} - ${getTeamName("teamB")}
Eindstand: ${scoreA} - ${scoreB}`);
}

function goalTeamA() {
  const teamAId = document.getElementById("teamA").value;
  const minute = getCurrentMinute();

  if (teamAId === ownClubId) {
    const player = getSelectedPlayer("playerSelect");
    if (!player) {
      alert("Kies eerst een speler.");
      return;
    }

    scoreA++;
    updateScore();

    createMessage(`⚽ DOELPUNT!

${minute}' - ${player.naam}

${getTeamName("teamA")} - ${getTeamName("teamB")}
${scoreA} - ${scoreB}`, player.foto);
    return;
  }

  scoreA++;
  updateScore();

  createMessage(`⚽ DOELPUNT!

${minute}'

${getTeamName("teamA")} - ${getTeamName("teamB")}
${scoreA} - ${scoreB}`);
}

function goalTeamB() {
  const teamBId = document.getElementById("teamB").value;
  const minute = getCurrentMinute();

  if (teamBId === ownClubId) {
    const player = getSelectedPlayer("playerSelect");
    if (!player) {
      alert("Kies eerst een speler.");
      return;
    }

    scoreB++;
    updateScore();

    createMessage(`⚽ DOELPUNT!

${minute}' - ${player.naam}

${getTeamName("teamA")} - ${getTeamName("teamB")}
${scoreA} - ${scoreB}`, player.foto);
    return;
  }

  scoreB++;
  updateScore();

  createMessage(`⚽ DOELPUNT TEGENSTANDER

${minute}'

${getTeamName("teamA")} - ${getTeamName("teamB")}
${scoreA} - ${scoreB}`);
}

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

  createMessage(`🔁 WISSEL

${minute}'

Eruit: ${outPlayer.naam}
Erin: ${inPlayer.naam}

${getTeamName("teamA")} - ${getTeamName("teamB")}
${scoreA} - ${scoreB}`);
}

function resetMatch() {
  if (!confirm("Weet je zeker dat je de wedstrijd wilt resetten?")) return;

  scoreA = 0;
  scoreB = 0;
  matchStatus = "not_started";
  firstHalfStartedAt = null;
  secondHalfStartedAt = null;
  pausedMinute = 0;
  currentMessage = "";
  currentPhotoPath = null;

  updateScore();
  setStatus("Nog niet gestart");

  document.getElementById("minute").textContent = "0'";
  document.getElementById("messagePreview").textContent = "Nog geen bericht.";
  document.getElementById("photoPreview").src = "";
  document.getElementById("photoPreviewWrap").classList.add("hidden");
}

function updateScore() {
  document.getElementById("scoreA").textContent = scoreA;
  document.getElementById("scoreB").textContent = scoreB;
}

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

function startTimerDisplay() {
  setInterval(() => {
    document.getElementById("minute").textContent = `${getCurrentMinute()}'`;
  }, 1000);
}

function getCurrentMinute() {
  if (matchStatus === "not_started") return 0;
  if (matchStatus === "ended" || matchStatus === "half_time") return pausedMinute;

  if (matchStatus === "first_half") {
    const diff = Date.now() - firstHalfStartedAt;
    return Math.max(1, Math.ceil(diff / 60000));
  }

  if (matchStatus === "second_half") {
    const diff = Date.now() - secondHalfStartedAt;
    return 45 + Math.max(1, Math.ceil(diff / 60000));
  }

  return 0;
}

function createMessage(text, photoPath = null) {
  currentMessage = text;
  currentPhotoPath = photoPath;

  document.getElementById("messagePreview").textContent = text;

  const wrap = document.getElementById("photoPreviewWrap");
  const img = document.getElementById("photoPreview");

  if (photoPath) {
    img.src = photoPath;
    wrap.classList.remove("hidden");
  } else {
    img.src = "";
    wrap.classList.add("hidden");
  }
}

async function shareWhatsApp() {
  if (!currentMessage) {
    alert("Maak eerst een bericht.");
    return;
  }

  try {
    if (currentPhotoPath) {
      const response = await fetch(currentPhotoPath);
      const blob = await response.blob();
      const filename = currentPhotoPath.split("/").pop();
      const file = new File([blob], filename, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: currentMessage, files: [file] });
        return;
      }
    }

    if (navigator.share) {
      await navigator.share({ text: currentMessage });
      return;
    }

    await navigator.clipboard.writeText(currentMessage);
    alert("Bericht gekopieerd. Open WhatsApp en plak het bericht handmatig.");
  } catch (error) {
    console.error(error);
    await navigator.clipboard.writeText(currentMessage);
    alert("Delen lukte niet. Het bericht is gekopieerd.");
  }
}

function updateClock() {
  const now = new Date();

  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  const dateString = now.toLocaleDateString("nl-NL", dateOptions);

  const timeString = now.toLocaleTimeString("nl-NL");

  document.getElementById("currentDate").textContent = dateString;
  document.getElementById("currentClock").textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();
