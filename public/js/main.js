// ==========================================================================
// 1. BACKEND API ROUTE HANDLER (Next.js Node.js Environment)
// ==========================================================================
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: "Server missing Supabase credentials." });
        }

        const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok || loginData.error) {
            return res.status(loginResponse.status).json({ 
                error: loginData.error?.message || "Invalid login details." 
            });
        }

        return res.status(200).json({ 
            success: true, 
            user: loginData.user.email,
            token: loginData.access_token,
            username: loginData.user.user_metadata?.display_name || "User"
        });
    } catch (err) {
        return res.status(500).json({ error: "Authentication system error: " + err.message });
    }
}

// ==========================================================================
// 2. CLIENT-SIDE ARCHITECTURE (Browser DOM Environment)
// ==========================================================================
if (typeof window !== "undefined") {
    // Supabase Client Initialization Configuration
    const supabaseUrl = 'https://xqihscjovjtgvvhbvcfn.supabase.co';
    const supabaseKey = 'sb_publishable_vNYWCu6wtVZEOea1im3q5Q_mmzd6ka6';
    
    // Fixed initialization bug: safely access global variable or imported instance
    const supabaseClient = window.supabase?.createClient 
        ? window.supabase.createClient(supabaseUrl, supabaseKey) 
        : null;

    document.addEventListener("DOMContentLoaded", () => {
        // --- DATA CORE & PERSISTENT STATES ---
        let favoriteTracks = [{ id: "song-1", title: "Midnight City", artist: "M83" }];
        let uploadedTracks = [{ id: "up-1", title: "Sample Community Beat", artist: "Prod. Unknown" }];
        let isPlaying = false;
        let selectedFile = null;

        // --- CENTRAL SELECTORS & DOM NODE MAPS ---
        const btnListen = document.getElementById("listen");
        const btnContribute = document.getElementById("contribute");
        const btnSettings = document.getElementById("settings");
        const btnQuicky = document.getElementById("quicky");
        const btnAccount = document.getElementById("account");
        
        const btnAuthTrigger = document.getElementById("auth-trigger-btn");
        const authModal = document.getElementById("auth-modal");
        const closeAuthModal = document.getElementById("close-auth-modal");

        const tabLogin = document.getElementById("tab-login");
        const tabSignup = document.getElementById("tab-signup");
        const containerLoginForm = document.getElementById("login-form-container");
        const containerSignupForm = document.getElementById("signup-form-container");

        const secondLvContainer = document.getElementById("second-lv"); 
        const menuListen = document.getElementById("listen-s");
        const menuContribute = document.getElementById("contribute-s");
        const menuSettings = document.getElementById("settings-menu");
        const menuQuicky = document.getElementById("quicky-menu");
        const quickyAddableList = document.getElementById("quicky-addable-list");

        const viewHome = document.getElementById("view-home");
        const viewBrowse = document.getElementById("view-browse");
        const viewPlaylists = document.getElementById("view-playlists");
        const viewUpload = document.getElementById("view-upload");
        const viewSettings = document.getElementById("view-settings");
        const viewAccount = document.getElementById("view-account"); 

        const btnMyMusic = document.getElementById("my-music");
        const btnTopCharts = document.getElementById("top-charts");
        const btnManageUp = document.getElementById("manage-up");
        const btnGeneralSettings = document.getElementById("general-settings");

        const manageModal = document.getElementById("manage-uploads-modal");
        const closeManageModal = document.getElementById("close-manage-modal");
        const userUploadsList = document.getElementById("user-uploads-list");

        const uploadForm = document.getElementById("uploadForm");
        const audioFileInput = document.getElementById("audioFile");
        const dropZone = document.getElementById("dropZone");
        const dropZoneText = document.getElementById("dropZoneText");
        const progressBarContainer = document.getElementById("uploadProgressContainer");
        const progressBar = document.getElementById("uploadProgressBar");

        const songRowPlayBtn = document.getElementById("playBtn");
        const mainPlayBtn = document.getElementById("mainPlayBtn");
        const heartBtn = document.querySelector(".heart-btn");
        const downloadBtn = document.getElementById("downloadBtn");
        const shareBtn = document.getElementById("shareBtn");

        const menuMap = [
            { trigger: btnListen, target: menuListen },
            { trigger: btnContribute, target: menuContribute },
            { trigger: btnSettings, target: menuSettings },
            { trigger: btnQuicky, target: menuQuicky }
        ];

        const viewPanels = [viewHome, viewBrowse, viewPlaylists, viewUpload, viewSettings, viewAccount];

        // --- WORKSPACE / VIEW CONTROLLER ---
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

        if (btnMyMusic) btnMyMusic.addEventListener("click", () => switchActiveWorkspaceView(viewHome));
        if (btnTopCharts) btnTopCharts.addEventListener("click", () => switchActiveWorkspaceView(viewBrowse));
        if (btnGeneralSettings) btnGeneralSettings.addEventListener("click", () => switchActiveWorkspaceView(viewSettings));
        if (btnContribute) btnContribute.addEventListener("click", () => switchActiveWorkspaceView(viewUpload));

        if (btnAccount) {
            btnAccount.addEventListener("click", () => {
                switchActiveWorkspaceView(viewAccount || viewSettings);
                toggleSecondLevelView(null);
            });
        }

        // --- AUTH TRANSACTIONS OVERLAY ENGINE ---
        if (btnAuthTrigger) {
            btnAuthTrigger.addEventListener("click", () => {
                if (authModal) {
                    authModal.classList.remove("hidden");
                    showLoginTab();
                    console.log("🔐 Authentication overlay displayed.");
                } else {
                    console.warn("Element #auth-modal missing from DOM.");
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
                if (e.target === authModal) authModal.classList.add("hidden");
            });
        }

        function showLoginTab() {
            if (authModal) authModal.setAttribute("data-view", "login");
            if (tabLogin) tabLogin.classList.add("active");
            if (tabSignup) tabSignup.classList.remove("active");
        }

        function showSignupTab() {
            if (authModal) authModal.setAttribute("data-view", "signup");
            if (tabSignup) tabSignup.classList.add("active");
            if (tabLogin) tabLogin.classList.remove("active");
        }

        if (tabLogin) tabLogin.addEventListener("click", showLoginTab);
        if (tabSignup) tabSignup.addEventListener("click", showSignupTab);

        // --- QUICK ACCESS PINNED TRACKS ---
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
                
                trackItem.querySelector(".quicky-remove-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    favoriteTracks = favoriteTracks.filter(t => t.id !== track.id);
                    buildQuickyAddables();
                });
                
                quickyAddableList.appendChild(trackItem);
            });
        }

        // --- STORAGE MANAGER HUB ---
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
                if (e.target === manageModal) manageModal.classList.add("hidden");
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
                itemRow.innerHTML = `
                    <div class="quicky-shortcut-meta" style="max-width: 75%;">
                        <span class="quicky-shortcut-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</span>
                        <span class="quicky-shortcut-artist">${track.artist}</span>
                    </div>
                    <button type="button" class="quicky-remove-btn delete-upload-btn" data-id="${track.id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;

                itemRow.querySelector(".delete-upload-btn").addEventListener("click", async () => {
                    if (!supabaseClient) {
                        alert("Supabase client integration is not ready.");
                        return;
                    }
                    if (confirm(`Are you sure you want to delete "${track.title}"?`)) {
                        const fileName = track.storagePath || track.id;
                        
                        const { error } = await supabaseClient.storage
                            .from('audio-files')
                            .remove([fileName]);

                        if (error) {
                            alert(`Failed deleting track: ${error.message}`);
                            return;
                        }

                        uploadedTracks = uploadedTracks.filter(t => t.id !== track.id);
                        renderUploadedTracks(); 
                    }
                });

                userUploadsList.appendChild(itemRow);
            });
        }

        // --- FILE BINARY DATA PIPELINE (R2 Cloud Architecture Integration) ---
        if (dropZone) dropZone.addEventListener("click", () => audioFileInput.click());

        if (audioFileInput) {
            audioFileInput.addEventListener("change", (e) => {
                if (e.target.files.length > 0) handleFileSelection(e.target.files[0]);
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
                if (e.dataTransfer.files.length > 0) handleFileSelection(e.dataTransfer.files[0]);
            });
        }

        function handleFileSelection(file) {
            if (file.type !== "audio/mpeg" && file.type !== "audio/mp3") {
                alert("Invalid file format. Please upload a valid MP3 file.");
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
                progressBar.style.width = "10%";

                try {
                    const response = await fetch("http://localhost:3000/api/get-presigned-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            filename: selectedFile.name,
                            contentType: selectedFile.type,
                            title, artist
                        })
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Failed token generation.");

                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", data.uploadUrl, true);
                    xhr.setRequestHeader("Content-Type", selectedFile.type);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            progressBar.style.width = `${(event.loaded / event.total) * 100}%`;
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200 || xhr.status === 201) {
                            uploadedTracks.push({
                                id: `up-${Date.now()}`,
                                title, artist
                            });

                            alert("Track successfully uploaded to storage!");
                            uploadForm.reset();
                            dropZoneText.innerText = "Click or drag an MP3 file here";
                            dropZoneText.style.color = "#b3b3b3";
                            progressBarContainer.classList.add("hidden");
                            selectedFile = null;
                            renderUploadedTracks();
                        } else {
                            alert("Failed moving audio asset to cloud buckets.");
                        }
                    };

                    xhr.onerror = () => alert("Network communication breakdown across data layers.");
                    xhr.send(selectedFile);

                } catch (err) {
                    alert(`Upload error: ${err.message}`);
                    progressBarContainer.classList.add("hidden");
                }
            });
        }

        // --- MEDIA HARDWARE DECK AUDIO LAYER ---
        function togglePlaybackState() {
            isPlaying = !isPlaying;
            const trackIcon = songRowPlayBtn?.querySelector("i");
            const masterIcon = mainPlayBtn?.querySelector("i");
            const iconClass = isPlaying ? "fa-solid fa-circle-pause" : "fa-solid fa-circle-play";

            if (trackIcon) trackIcon.className = iconClass;
            if (masterIcon) masterIcon.className = iconClass;
        }

        if (songRowPlayBtn) songRowPlayBtn.addEventListener("click", togglePlaybackState);
        if (mainPlayBtn) mainPlayBtn.addEventListener("click", togglePlaybackState);

        if (heartBtn) {
            heartBtn.addEventListener("click", () => {
                const icon = heartBtn.querySelector("i");
                icon.classList.toggle("fa-regular");
                icon.classList.toggle("fa-solid");
                heartBtn.style.color = icon.classList.contains("fa-solid") ? "#1db954" : "#b3b3b3";
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
        
        buildQuickyAddables();
    });
}