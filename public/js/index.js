// Ensure this is initialized with your credentials before the DOM event fires
const supabaseUrl = 'https://xqihscjovjtgvvhbvcfn.supabase.co';
const supabaseKey = 'sb_publishable_vNYWCu6wtVZEOea1im3q5Q_mmzd6ka6';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. DATA CORE & PERSISTENT STATES
    // ==========================================
    let favoriteTracks = [{ id: "song-1", title: "Midnight City", artist: "M83" }];
    let uploadedTracks = [{ id: "up-1", title: "Sample Community Beat", artist: "Prod. Unknown" }];
    let isPlaying = false;
    let selectedFile = null;

    // ==========================================
    // 2. CENTRAL SELECTORS & DOM NODE MAPS
    // ==========================================
    // Navigation & Global UI Triggers
    const btnListen = document.getElementById("listen");
    const btnContribute = document.getElementById("contribute");
    const btnSettings = document.getElementById("settings");
    const btnQuicky = document.getElementById("quicky");
    const btnAccount = document.getElementById("account");
    
    // Auth Trigger Modals & Sub-elements
    const btnAuthTrigger = document.getElementById("auth-trigger-btn"); // Your Auth Trigger Button
    const authModal = document.getElementById("auth-modal"); // Container/Overlay for login/signup forms
    const closeAuthModal = document.getElementById("close-auth-modal"); // Close button inside auth container

    // Tab Buttons & View Containers for Authentication Swapping
    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const containerLoginForm = document.getElementById("login-form-container");
    const containerSignupForm = document.getElementById("signup-form-container");

    // Drawer Containers
    const secondLvContainer = document.getElementById("second-lv"); 
    const menuListen = document.getElementById("listen-s");
    const menuContribute = document.getElementById("contribute-s");
    const menuSettings = document.getElementById("settings-menu");
    const menuQuicky = document.getElementById("quicky-menu");
    const quickyAddableList = document.getElementById("quicky-addable-list");

    // View Canvas Target Interfaces
    const viewHome = document.getElementById("view-home");
    const viewBrowse = document.getElementById("view-browse");
    const viewPlaylists = document.getElementById("view-playlists");
    const viewUpload = document.getElementById("view-upload");
    const viewSettings = document.getElementById("view-settings");
    const viewAccount = document.getElementById("view-account"); 

    // Internal Submenu Navigation Selection Anchors
    const btnMyMusic = document.getElementById("my-music");
    const btnTopCharts = document.getElementById("top-charts");
    const btnManageUp = document.getElementById("manage-up");
    const btnGeneralSettings = document.getElementById("general-settings");

    // Modal Interaction Hub Nodes
    const manageModal = document.getElementById("manage-uploads-modal");
    const closeManageModal = document.getElementById("close-manage-modal");
    const userUploadsList = document.getElementById("user-uploads-list");

    // Unified File Form Stream Interfaces
    const uploadForm = document.getElementById("uploadForm");
    const audioFileInput = document.getElementById("audioFile");
    const dropZone = document.getElementById("dropZone");
    const dropZoneText = document.getElementById("dropZoneText");
    const progressBarContainer = document.getElementById("uploadProgressContainer");
    const progressBar = document.getElementById("uploadProgressBar");

    // Media Control Node Selectors
    const songRowPlayBtn = document.getElementById("playBtn");
    const mainPlayBtn = document.getElementById("mainPlayBtn");
    const heartBtn = document.querySelector(".heart-btn");
    const downloadBtn = document.getElementById("downloadBtn");
    const shareBtn = document.getElementById("shareBtn");

    // Structural Array Configurations
    const menuMap = [
        { trigger: btnListen, target: menuListen },
        { trigger: btnContribute, target: menuContribute },
        { trigger: btnSettings, target: menuSettings },
        { trigger: btnQuicky, target: menuQuicky }
    ];

    const viewPanels = [viewHome, viewBrowse, viewPlaylists, viewUpload, viewSettings, viewAccount];

    // ==========================================
    // 3. CORE WORKSPACE / VIEW CONTROLLER
    // ==========================================
    function switchActiveWorkspaceView(targetViewPanel) {
        viewPanels.forEach(panel => {
            if (panel) {
                if (panel === targetViewPanel) {
                    panel.classList.remove("hidden");
                } else {
                    panel.classList.add("hidden");
                }
            }
        });
    }

    function toggleSecondLevelView(activeTarget) {
        let anyMenuVisible = false;
        menuMap.forEach(item => {
            if (item.target === activeTarget) {
                item.target.classList.remove("hidden");
                anyMenuVisible = true;
            } else {
                item.target.classList.add("hidden");
            }
        });

        if (anyMenuVisible) {
            secondLvContainer.classList.add("active-open");
        } else {
            secondLvContainer.classList.remove("active-open");
        }
    }

    // Bind Primary Navigation Click Event Triggers
    menuMap.forEach(item => {
        if (item.trigger && item.target) {
            item.trigger.addEventListener("click", () => {
                if (!item.target.classList.contains("hidden")) {
                    toggleSecondLevelView(null);
                } else {
                    toggleSecondLevelView(item.target);
                    if (item.trigger === btnQuicky) buildQuickyAddables();
                }
            });
        }
    });

    // Wire Up Submenu Anchors to Switch Workspace Layout Panels Dynamically
    if (btnMyMusic) btnMyMusic.addEventListener("click", () => switchActiveWorkspaceView(viewHome));
    if (btnTopCharts) btnTopCharts.addEventListener("click", () => switchActiveWorkspaceView(viewBrowse));
    if (btnGeneralSettings) btnGeneralSettings.addEventListener("click", () => switchActiveWorkspaceView(viewSettings));
    if (btnContribute) btnContribute.addEventListener("click", () => switchActiveWorkspaceView(viewUpload));

    // Account Button Navigation Link
    if (btnAccount) {
        btnAccount.addEventListener("click", () => {
            if (viewAccount) {
                switchActiveWorkspaceView(viewAccount);
            } else {
                switchActiveWorkspaceView(viewSettings);
            }
            toggleSecondLevelView(null);
        });
    }

    // ==========================================
    // 3.5 AUTH TRANSACTIONS MODAL OVERLAY ENGINE
    // ==========================================
    if (btnAuthTrigger) {
        btnAuthTrigger.addEventListener("click", () => {
            if (authModal) {
                authModal.classList.remove("hidden");
                // Default context: activate the Login tab automatically when modal triggers open
                showLoginTab();
                console.log("🔐 Authentication overlay displayed via #auth-trigger-btn.");
            } else {
                console.warn("Element #auth-modal missing from DOM structure.");
            }
        });
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener("click", () => {
            if (authModal) authModal.classList.add("hidden");
        });
    }

    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                authModal.classList.add("hidden");
            }
        });
    }

    // Helper Action: Switch active visible layers to Login Form view layout
    function showLoginTab() {
        if (authModal) authModal.setAttribute("data-view", "login");
        
        if (tabLogin) tabLogin.classList.add("active");
        if (tabSignup) tabSignup.classList.remove("active");
        console.log("🔄 Context swapped to: Login View");
    }

    // Helper Action: Switch active visible layers to Signup Form view layout
    function showSignupTab() {
        if (authModal) authModal.setAttribute("data-view", "signup");
        
        if (tabSignup) tabSignup.classList.add("active");
        if (tabLogin) tabLogin.classList.remove("active");
        console.log("🔄 Context swapped to: Signup View");
    }

    // Attach click listeners to the specific top tab buttons
    if (tabLogin) {
        tabLogin.addEventListener("click", () => {
            showLoginTab();
        });
    }

    if (tabSignup) {
        tabSignup.addEventListener("click", () => {
            showSignupTab();
        });
    }

    // ==========================================
    // 4. QUICK ACCESS TRACK MANAGEMENT LOGIC
    // ==========================================
    function buildQuickyAddables() {
        if (!quickyAddableList) return;
        quickyAddableList.innerHTML = "";
        
        if (favoriteTracks.length === 0) {
            quickyAddableList.innerHTML = `<p class="empty-fallback">No tracks pinned yet.</p>`;
            return;
        }

        favoriteTracks.forEach(track => {
            const trackItem = document.createElement("div");
            trackItem.className = "quicky-shortcut-item";
            trackItem.innerHTML = `
                <div class="quicky-shortcut-meta">
                    <span class="quicky-shortcut-title">🎵 ${track.title}</span>
                    <span class="quicky-shortcut-artist">${track.artist}</span>
                </div>
                <button type="button" class="quicky-remove-btn" title="Remove Shortcut">✕</button>
            `;
            
            const removeBtn = trackItem.querySelector(".quicky-remove-btn");
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                favoriteTracks = favoriteTracks.filter(t => t.id !== track.id);
                buildQuickyAddables();
            });
            
            quickyAddableList.appendChild(trackItem);
        });
    }

    // ==========================================
    // 5. MANAGE UPLOADS TABLE WINDOW ENGINE
    // ==========================================
    if (btnManageUp) {
        btnManageUp.addEventListener("click", () => {
            renderUploadedTracks();
            if (manageModal) manageModal.classList.remove("hidden");
        });
    }

    if (closeManageModal) {
        closeManageModal.addEventListener("click", () => {
            manageModal.classList.add("hidden");
        });
    }

    if (manageModal) {
        manageModal.addEventListener("click", (e) => {
            if (e.target === manageModal) {
                manageModal.classList.add("hidden");
            }
        });
    }

    function renderUploadedTracks() {
        if (!userUploadsList) return;
        userUploadsList.innerHTML = "";
        
        if (uploadedTracks.length === 0) {
            userUploadsList.innerHTML = `<p class="empty-fallback" style="margin-top:20px;">You haven't uploaded any songs yet.</p>`;
            return;
        }

        uploadedTracks.forEach(track => {
            const itemRow = document.createElement("div");
            itemRow.className = "quicky-shortcut-item"; 
            itemRow.style.marginHeight = "auto";
            
            itemRow.innerHTML = `
                <div class="quicky-shortcut-meta" style="max-width: 75%;">
                    <span class="quicky-shortcut-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</span>
                    <span class="quicky-shortcut-artist">${track.artist}</span>
                </div>
                <button type="button" class="quicky-remove-btn delete-upload-btn" data-id="${track.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;

            const deleteButton = itemRow.querySelector(".delete-upload-btn");
            deleteButton.addEventListener("click", async () => {
                if (confirm(`Are you sure you want to delete "${track.title}" from storage?`)) {
                    // Extract filename out of track profile if tracking public paths
                    const fileName = track.storagePath || track.id;
                    
                    // Delete from Supabase Storage Bucket
                    const { error } = await supabase.storage
                        .from('audio-files')
                        .remove([fileName]);

                    if (error) {
                        alert(`Failed deleting target track: ${error.message}`);
                        return;
                    }

                    uploadedTracks = uploadedTracks.filter(t => t.id !== track.id);
                    console.log(`Removed entry: ${track.id}`);
                    renderUploadedTracks(); 
                }
            });

            userUploadsList.appendChild(itemRow);
        });
    }

    // ==========================================
    // 6. SUPABASE STORAGE DATA PIPE TRANSMITTER
    // ==========================================
    if (dropZone) dropZone.addEventListener("click", () => audioFileInput.click());

    if (audioFileInput) {
        audioFileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    if (dropZone) {
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "#1db954";
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.style.borderColor = "#404040";
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "#404040";
            if (e.dataTransfer.files.length > 0) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }

    function handleFileSelection(file) {
        if (file.type !== "audio/mpeg" && file.type !== "audio/mp3") {
            alert("Invalid file format. Please drop a valid MP3 file.");
            return;
        }
        selectedFile = file;
        dropZoneText.innerText = `Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        dropZoneText.style.color = "#1db954";
    }

    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            if (!selectedFile) {
                alert("Please select or drop an MP3 audio file first.");
                return;
            }

            const title = document.getElementById("trackTitle").value;
            const artist = document.getElementById("trackArtist").value;
            
            progressBarContainer.classList.remove("hidden");
            progressBar.style.width = "10%"; // Initial visual loading feedback

            try {
                console.log("🔒 Requesting presigned secure URL signature from Node.js backend...");
                const response = await fetch("http://localhost:3000/api/get-presigned-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: selectedFile.name,
                        contentType: selectedFile.type,
                        title: title,
                        artist: artist
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed token generation.");

                const uploadUrl = data.uploadUrl;
                const permanentPublicUrl = data.publicTrackUrl;

                console.log("🚀 Token generated successfully. Direct upload payload transfer underway...");

                const xhr = new XMLHttpRequest();
                xhr.open("PUT", uploadUrl, true);
                xhr.setRequestHeader("Content-Type", selectedFile.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        progressBar.style.width = `${percentComplete}%`;
                        console.log(`📡 Upload progress status: ${percentComplete.toFixed(1)}%`);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        console.log(`✅ Binary storage complete! Public link generated: ${permanentPublicUrl}`);
                        
                        // Array mutation execution occurs instantly here inside the unified context block scope safely
                        uploadedTracks.push({
                            id: `up-${Date.now()}`,
                            title: title,
                            artist: artist
                        });

                        alert("Track successfully uploaded and published to Cloudflare R2!");
                        
                        // Hard reset form interfaces back to neutral defaults
                        uploadForm.reset();
                        dropZoneText.innerText = "Click or drag an MP3 file here";
                        dropZoneText.style.color = "#b3b3b3";
                        progressBarContainer.classList.add("hidden");
                        selectedFile = null;

                        // Re-render data tables automatically if modal window dashboard interface remains open
                        renderUploadedTracks();
                    } else {
                        alert("Failed moving audio asset to cloud buckets.");
                    }
                };

                xhr.onerror = () => alert("Network communication breakdown across data layers.");
                xhr.send(selectedFile);

            } catch (err) {
                console.error("Critical Cloud Sync Interruption: ", err);
                alert(`Upload error context: ${err.message}`);
                progressBarContainer.classList.add("hidden");
            }
        });
    }

    // ==========================================
    // 7. CORE MEDIA HARDWARE EXECUTION LAYER
    // ==========================================
    function togglePlaybackState() {
        isPlaying = !isPlaying;
        
        const trackIcon = songRowPlayBtn ? songRowPlayBtn.querySelector("i") : null;
        const masterIcon = mainPlayBtn ? mainPlayBtn.querySelector("i") : null;

        if (isPlaying) {
            if (trackIcon) trackIcon.className = "fa-solid fa-circle-pause";
            if (masterIcon) masterIcon.className = "fa-solid fa-circle-pause";
        } else {
            if (trackIcon) trackIcon.className = "fa-solid fa-circle-play";
            if (masterIcon) masterIcon.className = "fa-solid fa-circle-play";
        }
    }

    if (songRowPlayBtn) songRowPlayBtn.addEventListener("click", togglePlaybackState);
    if (mainPlayBtn) mainPlayBtn.addEventListener("click", togglePlaybackState);

    if (heartBtn) {
        heartBtn.addEventListener("click", () => {
            const icon = heartBtn.querySelector("i");
            icon.classList.toggle("fa-regular");
            icon.classList.toggle("fa-solid");
            
            if (icon.classList.contains("fa-solid")) {
                heartBtn.style.color = "#1db954";
            } else {
                heartBtn.style.color = "#b3b3b3";
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            alert("Starting track download: Midnight City - M83.mp3");
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert("Share link successfully copied to clipboard!");
            });
        });
    }

    const shuffleBtn = document.querySelector(".fa-shuffle")?.parentElement;
    const repeatBtn = document.querySelector(".fa-repeat")?.parentElement;
    const skipBackBtn = document.querySelector(".fa-backward-step")?.parentElement;
    const skipForwardBtn = document.querySelector(".fa-forward-step")?.parentElement;

    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", () => {
            shuffleBtn.classList.toggle("active-mode");
            shuffleBtn.style.color = shuffleBtn.classList.contains("active-mode") ? "#1db954" : "#b3b3b3";
        });
    }

    if (repeatBtn) {
        repeatBtn.addEventListener("click", () => {
            repeatBtn.classList.toggle("active-mode");
            repeatBtn.style.color = repeatBtn.classList.contains("active-mode") ? "#1db954" : "#b3b3b3";
        });
    }

    if (skipBackBtn) skipBackBtn.addEventListener("click", () => console.log("⏮️ Re-winding."));
    if (skipForwardBtn) skipForwardBtn.addEventListener("click", () => console.log("⏭️ Skipping forward."));
    
    buildQuickyAddables();
});