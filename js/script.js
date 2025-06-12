console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Utility: Converts seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch and display songs from a folder
async function getSongs(folder) {
    currFolder = folder;
    let songListElement = document.querySelector(".songList ul");
    songListElement.innerHTML = "<li>Loading...</li>";
    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all the songs in the playlist
        if (songs.length === 0) {
            songListElement.innerHTML = "<li>No songs found in this album.</li>";
        } else {
            songListElement.innerHTML = "";
            for (const song of songs) {
                songListElement.innerHTML += `
                <li data-song="${song}">
                    <img class="invert" width="34" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Harry</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="">
                    </div>
                </li>`;
            }
        }
    } catch (err) {
        songListElement.innerHTML = "<li>Error loading songs. Please try again.</li>";
        songs = [];
    }
    return songs;
}

// Play the given song
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    // Highlight the current playing song
    document.querySelectorAll(".songList li").forEach(li => {
        li.classList.toggle("active", li.dataset.song === track);
    });
};

// Display albums (folders)
async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "<div>Loading albums...</div>";
    try {
        let a = await fetch(`/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = Array.from(div.getElementsByTagName("a"));
        let albumHtml = "";
        for (const e of anchors) {
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[0];
                try {
                    let meta = await fetch(`/songs/${folder}/info.json`);
                    let info = await meta.json();
                    albumHtml += `
                        <div data-folder="${folder}" class="card" tabindex="0">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${info.title || "No Title"}</h2>
                            <p>${info.description || "No Description"}</p>
                        </div>`;
                } catch {
                    // If info.json not found, skip or show default values
                    albumHtml += `
                        <div data-folder="${folder}" class="card" tabindex="0">
                            <div class="play"></div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${folder}</h2>
                            <p>No description</p>
                        </div>`;
                }
            }
        }
        cardContainer.innerHTML = albumHtml || "<div>No albums found.</div>";
    } catch (err) {
        cardContainer.innerHTML = "<div>Error loading albums.</div>";
    }
}

// Handle album clicks (event delegation)
document.querySelector(".cardContainer").addEventListener("click", async (event) => {
    let card = event.target.closest(".card");
    if (card && card.dataset.folder) {
        let folder = "songs/" + card.dataset.folder;
        let loadedSongs = await getSongs(folder);
        if (loadedSongs.length > 0) {
            playMusic(loadedSongs[0]);
        }
    }
});

// Handle song clicks (event delegation)
document.querySelector(".songList ul").addEventListener("click", (event) => {
    let li = event.target.closest("li[data-song]");
    if (li && li.dataset.song) {
        playMusic(li.dataset.song);
    }
});

// Next/Previous handling with proper decoding
previous.addEventListener("click", () => {
    currentSong.pause();
    let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentFile);
    if ((index - 1) >= 0) {
        playMusic(songs[index - 1]);
    }
});

next.addEventListener("click", () => {
    currentSong.pause();
    let currentFile = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.indexOf(currentFile);
    if ((index + 1) < songs.length) {
        playMusic(songs[index + 1]);
    }
});

// Main app logic
async function main() {
    // Load default album (first load)
    let initialSongs = await getSongs("songs/ncs");
    if (initialSongs.length > 0) playMusic(initialSongs[0], true);

    // Display all albums
    await displayAlbums();

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update time and progress bar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Hamburger and close menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Volume controls
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume>img").src =
            currentSong.volume > 0
                ? document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
                : document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg");
    });

    // Mute/unmute
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();