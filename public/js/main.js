const STORAGE_KEYS = { auth: "beatz_flow_auth" };

(() => {
    // Hidden Global HTML5 Audio Player Engine Context
    const activeAudioEngine = new Audio();
    let currentActiveTracklist = [];
    let activeTrackIndex = 0;
    let selectedFilePayload = null;

    const elements = {
        btnListen: document.getElementById("listen"),
        btnContribute: document.getElementById("contribute"),
        btnSettings: document.getElementById("settings"),
        btnQuicky: document.getElementById("quicky"),
        btnAuthTrigger: document.getElementById("auth-trigger-btn"),
        authModal: document.getElementById("auth-modal"),
        closeAuthModal: document.getElementById("close-auth-modal"),
        tabLogin: document.getElementById("tab-login"),
        tabSignup: document.getElementById("tab-signup"),
        secondLvContainer: document.getElementById("second-lv"),
        menuListen: document.getElementById("listen-s"),
        menuContribute: document.getElementById("contribute-s"),
        menuSettings: document.getElementById("settings-menu"),
        menuQuicky: document.getElementById("quicky-menu"),
        viewHome: document.getElementById("view-home"),
        viewBrowse: document.getElementById("view-browse"),
        viewUpload: document.getElementById("view-upload"),
        viewSettings: document.getElementById("view-settings"),
        btnMyMusic: document.getElementById("my-music"),
        btnTopCharts: document.getElementById("top-charts"),
        btnGeneralSettings: document.getElementById("general-settings"),
        uploadForm: document.getElementById("uploadForm"),
        audioFileInput: document.getElementById("audioFile"),
        dropZone: document.getElementById("dropZone"),
        dropZoneText: document.getElementById("dropZoneText"),
        progressBarContainer: document.getElementById("uploadProgressContainer"),
        progressBar: document.getElementById("uploadProgressBar"),
        songDisplaySection: document.getElementById("listofsongs"),
        mainPlayBtn: document.getElementById("mainPlayBtn"),
        heartBtn: document.querySelector(".heart-btn"),
        globalSearchField: document.getElementById("search"),
        globalSearchForm: document.getElementById("search-form"),
        loginForm: document.getElementById("login-form"),
        signupForm: document.getElementById("signup-form"),
        
        // Footer Tracking Elements
        footerTitle: document.querySelector(".player-bar .track-title"),
        footerArtist: document.querySelector(".player-bar .track-artist"),
        footerTimeCurrent: document.querySelector(".player-controls .time:first-child"),
        footerTimeDuration: document.querySelector(".player-controls .time:last-child"),
        footerProgressBar: document.querySelector(".player-controls .progress"),
        footerVolumeBar: document.querySelector(".volume-bar .progress")
    };

    const viewPanels = [elements.viewHome, elements.viewBrowse, elements.viewUpload, elements.viewSettings];

    function showAlert(msg) { window.alert(msg); }

    function switchActiveWorkspaceView(targetViewPanel) {
        viewPanels.forEach((panel) => { if (panel) panel.classList.toggle("hidden", panel !== targetViewPanel); });
    }

    function toggleSecondLevelView(activeTarget) {
        const targets = [elements.menuListen, elements.menuContribute, elements.menuSettings, elements.menuQuicky];
        const anyVisible = targets.some((t) => t === activeTarget);
        targets.forEach((t) => { if (t) t.classList.toggle("hidden", t !== activeTarget); });
        if (elements.secondLvContainer) elements.secondLvContainer.classList.toggle("active-open", anyVisible);
    }

    // Audio Control Suite
    function loadAndPlayTrack(index) {
        if (!currentActiveTracklist[index]) return;
        activeTrackIndex = index;
        const track = currentActiveTracklist[index];

        activeAudioEngine.src = track.audio_url;
        activeAudioEngine.play()
            .then(() => updatePlaybackUi(true))
            .catch((e) => showAlert("Playback streaming block caught: " + e.message));

        if (elements.footerTitle) elements.footerTitle.textContent = track.title;
        if (elements.footerArtist) elements.footerArtist.textContent = track.artist;
    }

    function togglePlayback() {
        if (!activeAudioEngine.src) {
            if (currentActiveTracklist.length > 0) loadAndPlayTrack(0);
            return;
        }
        if (activeAudioEngine.paused) {
            activeAudioEngine.play().then(() => updatePlaybackUi(true));
        } else {
            activeAudioEngine.pause();
            updatePlaybackUi(false);
        }
    }

    function updatePlaybackUi(isPlaying) {
        const iconClass = isPlaying ? "fa-solid fa-circle-pause" : "fa-solid fa-circle-play";
        if (elements.mainPlayBtn) elements.mainPlayBtn.innerHTML = `<i class="${iconClass}"></i>`;
        
        // Synchronize row button icons
        document.querySelectorAll(".row-play-trigger").forEach((btn, idx) => {
            btn.innerHTML = `<i class="${idx === activeTrackIndex && isPlaying ? 'fa-solid fa-circle-pause' : 'fa-solid fa-circle-play'}"></i>`;
        });
    }

    // Handle Metadata Realtime Lookups
    async function refreshLibraryContents(searchString = "") {
        try {
            const target = searchString ? `/api/tracks?search=${encodeURIComponent(searchString)}` : '/api/tracks';
            const response = await fetch(target);
            const tracks = await response.json();
            
            currentActiveTracklist = tracks;
            renderDynamicTrackRows(tracks);
        } catch (err) {
            console.error("Failed fetching database maps: ", err);
        }
    }

    function renderDynamicTrackRows(tracks) {
        if (!elements.songDisplaySection) return;
        
        // Retain original header structure
        elements.songDisplaySection.innerHTML = `<h2>Catalog Library Collections</h2>`;
        
        if (tracks.length === 0) {
            elements.songDisplaySection.innerHTML += `<p class="empty-fallback" style="padding: 20px;">No matching digital binaries mapped.</p>`;
            return;
        }

        tracks.forEach((track, index) => {
            const bar = document.createElement("div");
            bar.className = "song-bar";
            bar.innerHTML = `
                <div class="song-info">
                    <div class="song-title">${track.title}</div>
                    <span class="song-artist">${track.artist}</span>
                </div>
                <div class="play-btn row-play-trigger" data-index="${index}">
                    <i class="fa-solid fa-circle-play"></i> 
                </div>
                <div class="download-btn download-trigger" data-url="${track.audio_url}" data-title="${track.title}">
                    <i class="fa-solid fa-download"></i>
                </div>
            `;

            bar.querySelector(".row-play-trigger").addEventListener("click", () => loadAndPlayTrack(index));
            bar.querySelector(".download-trigger").addEventListener("click", (e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = track.audio_url;
                link.download = `${track.title}.mp3`;
                link.target = "_blank";
                link.click();
            });

            elements.songDisplaySection.appendChild(bar);
        });
    }

    // Event Wireframe Bindings
    activeAudioEngine.addEventListener("timeupdate", () => {
        if (isNaN(activeAudioEngine.duration)) return;
        const current = activeAudioEngine.currentTime;
        const duration = activeAudioEngine.duration;
        
        const pct = (current / duration) * 100;
        if (elements.footerProgressBar) elements.footerProgressBar.style.width = `${pct}%`;
        
        const formatTime = (secs) => {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };
        if (elements.footerTimeCurrent) elements.footerTimeCurrent.textContent = formatTime(current);
        if (elements.footerTimeDuration) elements.footerTimeDuration.textContent = formatTime(duration);
    });

    activeAudioEngine.addEventListener("ended", () => {
        if (activeTrackIndex + 1 < currentActiveTracklist.length) {
            loadAndPlayTrack(activeTrackIndex + 1);
        } else {
            updatePlaybackUi(false);
        }
    });

    // Handle Upload Pipelines (File Conversion To Base64 Elements)
    if (elements.uploadForm) {
        elements.uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!selectedFilePayload) return showAlert("Please choose an operational file payload.");

            const title = document.getElementById("trackTitle")?.value.trim();
            const artist = document.getElementById("trackArtist")?.value.trim();

            if (elements.progressBarContainer) elements.progressBarContainer.classList.remove("hidden");
            if (elements.progressBar) elements.progressBar.style.width = "20%";

            const fileReader = new FileReader();
            fileReader.readAsDataURL(selectedFilePayload);
            fileReader.onload = async () => {
                try {
                    const rawBase64 = fileReader.result.split(',')[1];
                    if (elements.progressBar) elements.progressBar.style.width = "50%";

                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title, artist,
                            fileData: rawBase64,
                            fileName: selectedFilePayload.name,
                            fileType: selectedFilePayload.type
                        })
                    });

                    const outcome = await res.json();
                    if (!res.ok) throw new Error(outcome.error || "Upload pipeline fault.");

                    if (elements.progressBar) elements.progressBar.style.width = "100%";
                    showAlert("Binary distributed globally to Edge storage network rings!");
                    
                    elements.uploadForm.reset();
                    selectedFilePayload = null;
                    if (elements.dropZoneText) elements.dropZoneText.innerText = "Click or drag an MP3 audio track container here";
                    
                    switchActiveWorkspaceView(elements.viewHome);
                    refreshLibraryContents();
                } catch (err) {
                    showAlert(err.message);
                } finally {
                    if (elements.progressBarContainer) elements.progressBarContainer.classList.add("hidden");
                }
            };
        });
    }

    // Search Operations Interception Block
    if (elements.globalSearchForm) {
        elements.globalSearchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            refreshLibraryContents(elements.globalSearchField?.value.trim());
        });
    }
    if (elements.globalSearchField) {
        elements.globalSearchField.addEventListener("input", (e) => {
            refreshLibraryContents(e.target.value.trim());
        });
    }

    // Account State Sync Subsystems
    async function runAuthenticationRequest(endpoint, payload) {
        const response = await fetch(`/api/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Authentication structural failure.");
        
        localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(data));
        updateProfileInterfaceElements();
        closeAuthModal();
        showAlert(`Session assigned successfully. Welcome ${data.username}!`);
    }

    function updateProfileInterfaceElements() {
        const raw = localStorage.getItem(STORAGE_KEYS.auth);
        if (!elements.btnAuthTrigger) return;
        if (raw) {
            const profile = JSON.parse(raw);
            elements.btnAuthTrigger.textContent = profile.username ? profile.username.substring(0, 2).toUpperCase() : "USR";
            elements.btnAuthTrigger.style.backgroundColor = "#1db954";
        } else {
            elements.btnAuthTrigger.textContent = "Sign In";
            elements.btnAuthTrigger.style.backgroundColor = "#282828";
        }
    }

    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            runAuthenticationRequest("login", {
                email: document.getElementById("login-email")?.value.trim(),
                password: document.getElementById("login-password")?.value
            });
        });
    }

    if (elements.signupForm) {
        elements.signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            runAuthenticationRequest("signup", {
                username: document.getElementById("signup-username")?.value.trim(),
                email: document.getElementById("signup-email")?.value.trim(),
                password: document.getElementById("signup-password")?.value
            });
        });
    }

    // Navigation Wireframing Hooks
    if (elements.btnListen) elements.btnListen.addEventListener("click", () => toggleSecondLevelView(elements.menuListen));
    if (elements.btnContribute) elements.btnContribute.addEventListener("click", () => { switchActiveWorkspaceView(elements.viewUpload); toggleSecondLevelView(null); });
    if (elements.btnSettings) elements.btnSettings.addEventListener("click", () => { switchActiveWorkspaceView(elements.viewSettings); toggleSecondLevelView(elements.menuSettings); });
    if (elements.btnQuicky) elements.btnQuicky.addEventListener("click", () => toggleSecondLevelView(elements.menuQuicky));
    if (elements.btnMyMusic) elements.btnMyMusic.addEventListener("click", () => { switchActiveWorkspaceView(elements.viewHome); toggleSecondLevelView(null); });
    if (elements.btnTopCharts) elements.btnTopCharts.addEventListener("click", () => { switchActiveWorkspaceView(elements.viewBrowse); toggleSecondLevelView(null); });
    if (elements.btnGeneralSettings) elements.btnGeneralSettings.addEventListener("click", () => { switchActiveWorkspaceView(elements.viewSettings); toggleSecondLevelView(null); });
    if (elements.btnAuthTrigger) elements.btnAuthTrigger.addEventListener("click", () => { elements.authModal?.classList.remove("hidden"); showLoginTab(); });
    if (elements.closeAuthModal) elements.closeAuthModal.addEventListener("click", () => elements.authModal?.classList.add("hidden"));
    if (elements.tabLogin) elements.tabLogin.addEventListener("click", showLoginTab);
    if (elements.tabSignup) elements.tabSignup.addEventListener("click", () => { elements.authModal?.setAttribute("data-view", "signup"); elements.tabSignup.classList.add("active"); elements.tabLogin.classList.remove("active"); });
    if (elements.mainPlayBtn) elements.mainPlayBtn.addEventListener("click", togglePlayback);

    if (elements.dropZone && elements.audioFileInput) {
        elements.dropZone.addEventListener("click", () => elements.audioFileInput.click());
        elements.audioFileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                selectedFilePayload = e.target.files[0];
                if (elements.dropZoneText) elements.dropZoneText.innerText = `Ready to Stream: ${selectedFilePayload.name}`;
            }
        });
    }

    function showLoginTab() { elements.authModal?.setAttribute("data-view", "login"); elements.tabLogin?.classList.add("active"); elements.tabSignup?.classList.remove("active"); }

    // Bootstrap Initialization 
    updateProfileInterfaceElements();
    switchActiveWorkspaceView(elements.viewHome);
    refreshLibraryContents();
})();