document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("mainPlayBtn");
    const heartBtn = document.querySelector(".heart-btn");
    let isPlaying = false;

    // Toggle Play / Pause state on main bottom button
    playBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
            playBtn.style.color = "#1db954"; // Turns Green when playing
        } else {
            playBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
            playBtn.style.color = "#ffffff";
        }
    });

    // Toggle Like button tracking state
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
});