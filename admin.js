const API_BASE = "https://olympic-lucy-simple-lighting.trycloudflare.com";

// -----------------
// LOGIN
// -----------------
function adminLogin() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (user === "admin" && pass === "admin123") {
        // Simple front-end only auth
        window.location.href = "admin-dashboard.html";
    } else {
        alert("Invalid credentials!");
    }
}

// -----------------
// DASHBOARD INIT
// -----------------
if (window.location.pathname.includes("admin-dashboard.html")) {
    loadParties();
    loadCandidates();
    loadVoters();
    loadResults();
    setInterval(loadResults, 3000);
}


// Load parties into dropdown
function loadParties() {
    fetch(`${API_BASE}/admin/parties`)
        .then(res => res.json())
        .then(data => {
            let select = document.getElementById("partySelect");
            select.innerHTML = "";
            data.forEach(p => {
                let opt = document.createElement("option");
                opt.value = p.party_id;
                opt.textContent = `${p.party_id} - ${p.name}`;
                select.appendChild(opt);
            });
        });
}

// Load candidates table
function loadCandidates() {
    fetch(`${API_BASE}/candidates`)
        .then(res => res.json())
        .then(data => {
            let tbody = document.getElementById("candidatesTable");
            tbody.innerHTML = "";
            data.forEach(c => {
                let tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="border p-2">${c.candidate_id}</td>
                    <td class="border p-2">${c.name}</td>
                    <td class="border p-2">${c.party}</td>
                    <td class="border p-2">
                        <button onclick="deleteCandidate(${c.candidate_id})"
                                class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Load voters table
function loadVoters() {
    fetch(`${API_BASE}/admin/voters`)
        .then(res => res.json())
        .then(data => {
            let tbody = document.getElementById("votersTable");
            tbody.innerHTML = "";
            data.forEach(v => {
                let tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="border p-2">${v.voter_id}</td>
                    <td class="border p-2">${v.name}</td>
                    <td class="border p-2">${v.aadhaar}</td>
                    <td class="border p-2">${v.constituency}</td>
                    <td class="border p-2">${v.has_voted ? "Yes" : "No"}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Add candidate
function addCandidate() {
    let name = document.getElementById("candidateName").value;
    let partyId = document.getElementById("partySelect").value;

    if (!name || !partyId) {
        alert("Enter name and select party");
        return;
    }

    fetch(`${API_BASE}/admin/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, partyId: Number(partyId) })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            document.getElementById("candidateName").value = "";
            loadCandidates();
        });
}

// Delete candidate
function deleteCandidate(id) {
    if (!confirm("Delete this candidate?")) return;

    fetch(`${API_BASE}/admin/candidates/${id}`, {
        method: "DELETE"
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadCandidates();
        });
}

// Reset election
function resetElection() {
    if (!confirm("Are you sure you want to reset the whole election?")) return;

    fetch(`${API_BASE}/admin/reset`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadVoters();
        });
}

function loadResults() {
    fetch(`${API_BASE}/results`)
        .then(res => res.json())
        .then(data => {
            let tbody = document.getElementById("resultsTable");
            tbody.innerHTML = "";
            data.forEach(r => {
                let tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="border p-2">${r.name}</td>
                    <td class="border p-2">${r.party}</td>
                    <td class="border p-2 font-bold">${r.total_votes}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function addVoter() {
    let aadhaar = document.getElementById("v_aadhaar").value.trim();
    let name = document.getElementById("v_name").value.trim();
    let dob = document.getElementById("v_dob").value;
    let constituency = document.getElementById("v_const").value.trim();

    // Aadhaar front-end check (optional but good UX)
    if (!/^\d{12}$/.test(aadhaar)) {
        alert("Aadhaar must be exactly 12 digits!");
        return;
    }

    fetch(`${API_BASE}/admin/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            aadhaar,
            name,
            dob,
            constituency
        })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadVoters();

            document.getElementById("v_aadhaar").value = "";
            document.getElementById("v_name").value = "";
            document.getElementById("v_dob").value = "";
            document.getElementById("v_const").value = "";
        });
}












