
const STORAGE_KEY = "jobTrackerApplications";

let applications = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// DOM Elements
const jobModal = document.getElementById("jobModal");
const jobForm = document.getElementById("jobForm");
const jobTableBody = document.getElementById("jobTableBody");

const addJobBtn = document.getElementById("addJobBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortDate = document.getElementById("sortDate");

const emptyState = document.getElementById("emptyState");

// Form elements
const jobIdInput = document.getElementById("jobId");
const companyInput = document.getElementById("company");
const roleInput = document.getElementById("role");
const locationInput = document.getElementById("location");
const dateAppliedInput = document.getElementById("dateApplied");
const statusInput = document.getElementById("status");
const jobLinkInput = document.getElementById("jobLink");
const notesInput = document.getElementById("notes");

// Save data to LocalStorage
function saveApplications() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

// Safe HTML output for text fields
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Format date
function formatDate(date) {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return escapeHTML(date);

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Open modal
function openModal() {
    jobModal.classList.add("show");
}

// Close modal
function closeModal() {
    jobModal.classList.remove("show");
    jobForm.reset();
    jobIdInput.value = "";
    document.getElementById("modalTitle").textContent = "Add Application";
}

// Add button
addJobBtn.addEventListener("click", () => {
    closeModal();
    openModal();

    // Set today's date automatically
    dateAppliedInput.value = new Date().toISOString().slice(0, 10);
});

// Close modal buttons
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// Close modal by clicking outside
jobModal.addEventListener("click", (event) => {
    if (event.target === jobModal) {
        closeModal();
    }
});

// Close modal with Escape
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal();
    }
});

// Add or update application
jobForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = jobIdInput.value;

    const application = {
        id: id || String(Date.now()),
        company: companyInput.value.trim(),
        role: roleInput.value.trim(),
        location: locationInput.value.trim(),
        dateApplied: dateAppliedInput.value,
        status: statusInput.value,
        jobLink: jobLinkInput.value.trim(),
        notes: notesInput.value.trim()
    };

    if (id) {
        // Update existing application
        applications = applications.map(job =>
            job.id === id ? application : job
        );
    } else {
        // Add new application
        applications.unshift(application);
    }

    saveApplications();
    renderApplications();
    closeModal();
});

// Edit application
function editApplication(id) {
    const job = applications.find(item => item.id === id);

    if (!job) return;

    jobIdInput.value = job.id;
    companyInput.value = job.company;
    roleInput.value = job.role;
    locationInput.value = job.location;
    dateAppliedInput.value = job.dateApplied;
    statusInput.value = job.status;
    jobLinkInput.value = job.jobLink;
    notesInput.value = job.notes;

    document.getElementById("modalTitle").textContent = "Edit Application";

    openModal();
}

// Delete application
function deleteApplication(id) {
    const confirmed = confirm("Are you sure you want to delete this application?");

    if (!confirmed) return;

    applications = applications.filter(job => job.id !== id);

    saveApplications();
    renderApplications();
}

// Status badge
function getStatusClass(status) {
    const classes = {
        Applied: "status-applied",
        Interview: "status-interview",
        Offer: "status-offer",
        Rejected: "status-rejected"
    };

    return classes[status] || "status-applied";
}

// Render table
function renderApplications() {

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;

    let filteredApplications = applications.filter(job => {

        const matchesSearch =
            job.company.toLowerCase().includes(searchText) ||
            job.role.toLowerCase().includes(searchText) ||
            job.location.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" || job.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sort by date
    filteredApplications.sort((a, b) => {
        if (sortDate.value === "newest") {
            return b.dateApplied.localeCompare(a.dateApplied);
        }

        return a.dateApplied.localeCompare(b.dateApplied);
    });

    // Clear old rows
    jobTableBody.innerHTML = "";

    // Empty state
    emptyState.style.display =
        filteredApplications.length === 0 ? "block" : "none";

    // Display applications
    filteredApplications.forEach(job => {

        const row = document.createElement("tr");

        const safeLink = getSafeJobLink(job.jobLink);

        row.innerHTML = `
            <td class="company-cell">${escapeHTML(job.company)}</td>

            <td class="role-cell">${escapeHTML(job.role)}</td>

            <td class="location-cell">
                ${escapeHTML(job.location || "-")}
            </td>

            <td>${formatDate(job.dateApplied)}</td>

            <td>
                <span class="status ${getStatusClass(job.status)}">
                    ${escapeHTML(job.status)}
                </span>
            </td>

            <td>
                ${
                    safeLink
                    ? `<button class="action-btn" data-action="link" data-id="${escapeHTML(job.id)}" title="Open job link">↗</button>`
                    : ""
                }

                <button class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(job.id)}"
                    title="Edit">
                    ✎
                </button>

                <button class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(job.id)}"
                    title="Delete">
                    🗑
                </button>
            </td>
        `;

        jobTableBody.appendChild(row);
    });

    updateDashboard();
}

// Only allow safe external job URLs
function getSafeJobLink(value) {
    try {
        const url = new URL(value);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        return null;
    }

    return null;
}

// Handle table action clicks
jobTableBody.addEventListener("click", (event) => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editApplication(id);
    }

    if (action === "delete") {
        deleteApplication(id);
    }

    if (action === "link") {
        const job = applications.find(item => item.id === id);

        const safeLink = job ? getSafeJobLink(job.jobLink) : null;

        if (safeLink) {
            window.open(safeLink, "_blank", "noopener,noreferrer");
        }
    }
});

// Dashboard statistics
function updateDashboard() {

    document.getElementById("totalCount").textContent =
        applications.length;

    document.getElementById("interviewCount").textContent =
        applications.filter(job => job.status === "Interview").length;

    document.getElementById("offerCount").textContent =
        applications.filter(job => job.status === "Offer").length;

    document.getElementById("rejectedCount").textContent =
        applications.filter(job => job.status === "Rejected").length;
}

// Search
searchInput.addEventListener("input", renderApplications);

// Filter
filterStatus.addEventListener("change", renderApplications);

// Sort
sortDate.addEventListener("change", renderApplications);

// Initial load
renderApplications();
