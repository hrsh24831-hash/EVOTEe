// ===========================
// GLOBAL CONFIGURATION
// ===========================
// ⚠️ IMPORTANT: Replace 'something' with your actual Ngrok ID
// Note: No space at the start of the string!
const cors = require("cors");
app.use(cors());

const API_BASE = "https://alliance-reductions-welding-spiritual.trycloudflare.com";

// SHARED HEADERS (The "VIP Pass" for Ngrok)
// We use this in every request so Ngrok doesn't show the warning page.
const NGROK_HEADERS = {
    "ngrok-skip-browser-warning": "69420",
    "Content-Type": "application/json"
};

const partyColors = {
    "BJP": { bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-300" },
    "Congress": { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-300" },
    "AAP": { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-300" },
    "Independent": { bg: "bg-gray-500/20", border: "border-gray-500/30", text: "text-gray-300" },
    "Party A": { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300" },
    "Party B": { bg: "bg-yellow-500/20", border: "border-yellow-500/30", text: "text-yellow-300" }
};

const partyLogos = {
    "BJP": "assets/party-logos/bjp.png",
    "Congress": "assets/party-logos/congress.png",
    "AAP": "assets/party-logos/aap.png",
    "Independent": "assets/party-logos/independent.png",
    "Party A": "assets/party-logos/partya.png",
    "Party B": "assets/party-logos/partyb.png"
};

let selectedCandidate = null;


// ===========================
// 1. VERIFY VOTER
// ===========================
async function verifyVoter() {
    let aadhaar = document.getElementById("aadhaar").value;

    if(!aadhaar) { alert("Enter Aadhaar Number"); return; }

    try {
        let response = await fetch(`${API_BASE}/verify`, {
            method: "POST",
            headers: NGROK_HEADERS, // <--- Added Header here
            body: JSON.stringify({ aadhaar: Number(aadhaar) })
        });

        if (!response.ok) {
            alert("Voter not found or already voted!");
            return;
        }

        let voter = await response.json();
        localStorage.setItem("voter", JSON.stringify(voter));
        window.location.href = "vote.html";
        
    } catch (error) {
        console.error("Error verifying voter:", error);
        alert("Connection failed. Check console.");
    }
}


// ===========================
// 2. LOAD CANDIDATES UI
// ===========================
function loadCandidates() {
    // Added headers object to GET request to bypass Ngrok warning
    fetch(`${API_BASE}/candidates`, { headers: NGROK_HEADERS }) 
        .then(res => res.json())
        .then(data => {

            let box = document.getElementById("candidateList");
            if (!box) return; 
            box.innerHTML = "";

            data.forEach(c => {
                // Normalize Party Name
                let rawParty = c.party || "Independent";
                let partyName = rawParty.toLowerCase().trim();

                if (partyName.includes("aam")) partyName = "AAP";
                else if (partyName.includes("bjp")) partyName = "BJP";
                else if (partyName.includes("cong")) partyName = "Congress";
                else if (partyName.includes("ind")) partyName = "Independent";
                else if (partyName.includes("party a")) partyName = "Party A";
                else if (partyName.includes("party b")) partyName = "Party B";
                else partyName = rawParty;

                let style = partyColors[partyName] || partyColors["Independent"];
                let logoSrc = partyLogos[partyName] || partyLogos["Independent"];

                let div = document.createElement("div");
                div.className = 
                    `group relative p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 
                    shadow-lg hover:shadow-blue-500/20 hover:border-blue-400/50 hover:-translate-y-1 
                    cursor-pointer transition-all duration-300 flex flex-col items-center gap-4`;

                div.innerHTML = `
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <img src="${logoSrc}" class="h-20 w-20 object-contain rounded-full bg-white/10 p-2 shadow-inner" 
                         onerror="this.src='https://via.placeholder.com/80?text=?'" />
                    <div class="text-center">
                        <div class="text-2xl font-bold text-white mb-1 tracking-wide">${c.name}</div>
                        <div class="inline-block px-4 py-1 rounded-full text-sm font-medium border ${style.bg} ${style.border} ${style.text}">
                            ${partyName}
                        </div>
                    </div>
                    <input type="radio" name="candidate" value="${c.candidate_id}" class="hidden" />
                `;

                div.addEventListener("click", () => {
                    document.querySelectorAll("#candidateList > div").forEach(d => {
                        d.classList.remove("ring-2", "ring-blue-500", "bg-white/10");
                        d.classList.add("bg-white/5");
                    });
                    div.classList.remove("bg-white/5");
                    div.classList.add("ring-2", "ring-blue-500", "bg-white/10");

                    let radio = div.querySelector("input");
                    radio.checked = true;
                    selectedCandidate = radio.value;
                });

                box.appendChild(div);
            });
        })
        .catch(err => console.error("Error loading candidates:", err));
}


// ===========================
// 3. CAST VOTE
// ===========================
async function castVote() {
    if (!selectedCandidate) return alert("Please select a candidate first!");

    let voterStr = localStorage.getItem("voter");
    if (!voterStr) return alert("Session expired. Please login again.");
    
    let voter = JSON.parse(voterStr);

    try {
        let response = await fetch(`${API_BASE}/vote`, {
            method: "POST",
            headers: NGROK_HEADERS, // <--- Added Header here
            body: JSON.stringify({
                voterId: voter.voter_id,
                candidateId: selectedCandidate
            })
        });

        let res = await response.json();
        
        if (response.ok) {
            window.location.href = "result.html"; 
        } else {
            alert(res.message);
        }
    } catch (error) {
        console.error("Error casting vote:", error);
        alert("Failed to cast vote.");
    }
}


// ===========================
// 4. LOAD RESULTS (Refactored)
// ===========================
function loadResults() {
    fetch(`${API_BASE}/results`, { headers: NGROK_HEADERS }) // <--- Added Header here
        .then(res => res.json())
        .then(data => {
            let box = document.getElementById("resultBox");
            if (!box) return;
            box.innerHTML = "";

            const maxVotes = Math.max(...data.map(r => r.total_votes)) || 1;

            data.forEach((r, index) => {
                let rawParty = r.party || "Independent";
                let partyName = rawParty.toLowerCase().trim();

                if (partyName.includes("aam")) partyName = "AAP";
                else if (partyName.includes("bjp")) partyName = "BJP";
                else if (partyName.includes("cong")) partyName = "Congress";
                else if (partyName.includes("ind")) partyName = "Independent";
                else partyName = rawParty;

                let style = partyColors[partyName] || partyColors["Independent"];
                let logo = partyLogos[partyName] || partyLogos["Independent"];

                let rankIcon = "";
                if (index === 0) rankIcon = "🥇";
                else if (index === 1) rankIcon = "🥈";
                else if (index === 2) rankIcon = "🥉";
                else rankIcon = `<span class="text-gray-500 font-mono">#${index + 1}</span>`;

                let div = document.createElement("div");
                div.className = "flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl transition hover:bg-white/10";
                div.innerHTML = `
                    <div class="text-2xl font-bold w-8 text-center">${rankIcon}</div>
                    <img src="${logo}" class="h-12 w-12 object-contain rounded-full bg-white/5 p-1" onerror="this.src='https://via.placeholder.com/50?text=?'"/>
                    <div class="flex-1">
                        <div class="flex justify-between items-end mb-1">
                            <span class="text-lg font-semibold text-white">${r.name}</span>
                            <span class="text-xl font-bold text-yellow-400">${r.total_votes} <span class="text-xs text-gray-400 font-normal">votes</span></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs px-2 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}">
                                ${partyName}
                            </span>
                            <div class="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500" style="width: ${(r.total_votes / maxVotes) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                `;
                box.appendChild(div);
            });
        })
        .catch(err => console.error("Error loading results:", err));
}


// ===========================
// MAIN EXECUTION (The "Router")
// ===========================
// Checks if elements exist instead of checking filenames
document.addEventListener("DOMContentLoaded", () => {
    
    // If we are on the Vote Page
    if (document.getElementById("candidateList")) {
        loadCandidates();
    }

    // If we are on the Result Page
    if (document.getElementById("resultBox")) {
        loadResults();
    }

});













