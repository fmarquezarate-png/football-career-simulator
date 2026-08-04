// Main entry point
import { StorageManager } from './data/storage.js';

const storage = new StorageManager();

// Check for saved game on homepage
const savedGame = storage.loadCareer();
const continueBtn = document.getElementById('continueBtn');

if (savedGame && continueBtn) {
  continueBtn.classList.remove('disabled');
  continueBtn.href = 'pages/career.html';
  continueBtn.querySelector('.card-desc').textContent =
    `${savedGame.playerName} · ${savedGame.teamName} · T${savedGame.season}`;
}
