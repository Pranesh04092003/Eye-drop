// Eye Drops Reminder Application
class EyeDropsReminder {
    constructor() {
        this.isActive = false;
        this.intervalId = null;
        this.nextReminderTime = null;
        this.history = this.loadHistory();
        this.audioContext = null;
        this.soundInterval = null;
        this.settings = {
            startTime: '08:00',
            endTime: '20:00',
            interval: 60, // minutes
            soundEnabled: true
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.displayHistory();
        this.requestNotificationPermission();
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const testBtn = document.getElementById('testBtn');
        
        if (!startBtn || !stopBtn || !testBtn) {
            console.error('Buttons not found!');
            return;
        }
        
        startBtn.addEventListener('click', () => {
            console.log('Start button clicked!');
            this.start();
        });
        stopBtn.addEventListener('click', () => this.stop());
        testBtn.addEventListener('click', () => this.testNotification());
        document.getElementById('doneBtn').addEventListener('click', () => this.closeModal('completed'));
        document.getElementById('snoozeBtn').addEventListener('click', () => this.snooze());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // Save settings on change
        document.getElementById('startTime').addEventListener('change', (e) => {
            this.settings.startTime = e.target.value;
            this.saveSettings();
        });
        document.getElementById('endTime').addEventListener('change', (e) => {
            this.settings.endTime = e.target.value;
            this.saveSettings();
        });
        document.getElementById('interval').addEventListener('change', (e) => {
            this.settings.interval = parseInt(e.target.value);
            this.saveSettings();
        });
        document.getElementById('soundEnabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveSettings();
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('eyeDropsSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
            document.getElementById('startTime').value = this.settings.startTime;
            document.getElementById('endTime').value = this.settings.endTime;
            document.getElementById('interval').value = this.settings.interval;
            document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
        }
    }

    saveSettings() {
        localStorage.setItem('eyeDropsSettings', JSON.stringify(this.settings));
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    start() {
        console.log('Start method called. isActive:', this.isActive);
        if (this.isActive) return;

        this.isActive = true;
        console.log('Starting reminders...');
        this.scheduleNextReminder();
        this.updateUI();
        this.saveState();

        // Check every minute for reminders
        this.intervalId = setInterval(() => {
            this.checkReminder();
        }, 60000); // Check every minute
    }

    stop() {
        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.nextReminderTime = null;
        this.updateUI();
        this.saveState();
    }

    scheduleNextReminder() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Parse start and end times
        const [startHour, startMin] = this.settings.startTime.split(':').map(Number);
        const [endHour, endMin] = this.settings.endTime.split(':').map(Number);
        
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Calculate next reminder
        let nextMinutes = currentMinutes + this.settings.interval;
        
        // If current time is before start time, set to start time
        if (currentMinutes < startTimeMinutes) {
            nextMinutes = startTimeMinutes;
        }
        
        // If next reminder is after end time, schedule for next day start time
        if (nextMinutes > endTimeMinutes) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHour, startMin, 0, 0);
            this.nextReminderTime = tomorrow;
        } else {
            const nextDate = new Date(now);
            nextDate.setHours(Math.floor(nextMinutes / 60), nextMinutes % 60, 0, 0);
            this.nextReminderTime = nextDate;
        }

        this.updateUI();
    }

    checkReminder() {
        if (!this.isActive || !this.nextReminderTime) return;

        const now = new Date();
        
        if (now >= this.nextReminderTime) {
            this.showReminder();
            this.scheduleNextReminder();
        }
    }

    showReminder() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Add to history
        this.addToHistory({
            time: now.toISOString(),
            status: 'pending',
            timeString: timeString
        });

        // Show modal
        document.getElementById('modalTime').textContent = timeString;
        document.getElementById('notificationModal').classList.add('show');

        // Browser notification
        if (Notification.permission === 'granted') {
            const notification = new Notification('💧 Eye Drops Reminder', {
                body: `It's ${timeString} - Time to use your eye drops!`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">💧</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">💧</text></svg>',
                requireInteraction: true,
                tag: 'eyedrops-reminder'
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Play sound
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
    }

    playNotificationSound() {
        // Stop any existing sound
        this.stopNotificationSound();
        
        // Create continuous notification sound using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const playBeep = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);

            // Second beep
            setTimeout(() => {
                const osc2 = this.audioContext.createOscillator();
                const gain2 = this.audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(this.audioContext.destination);
                osc2.frequency.value = 1000;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                osc2.start(this.audioContext.currentTime);
                osc2.stop(this.audioContext.currentTime + 0.4);
            }, 200);
        };

        // Play initial beep
        playBeep();
        
        // 

        // Play initial beep
        playBeep();
        
        // Continue playing beeps every 2 seconds
        this.soundInterval = setInterval(() => {
            playBeep();
        }, 2000);
    }

    stopNotificationSound() {
        if (this.soundInterval) {
            clearInterval(this.soundInterval);
            this.soundInterval = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    closeModal(status = 'completed') {
        document.getElementById('notificationModal').classList.remove('show');
        
        // Update last history item status
        if (this.history.length > 0) {
            const lastItem = this.history[this.history.length - 1];
            if (lastItem.status === 'pending') {
                lastItem.status = status;
                this.saveHistory();
                this.displayHistory();
            }
        }
    }

    snooze() {
        this.closeModal('snoozed');
        
        // Schedule snooze reminder (5 minutes)
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
        this.nextReminderTime = snoozeTime;
        this.updateUI();
    }

    testNotification() {
        this.showReminder();
    }

    addToHistory(entry) {
        this.history.push(entry);
        this.saveHistory();
        this.displayHistory();
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        const today = new Date().toDateString();
        
        // Filter today's history
        const todayHistory = this.history.filter(item => {
            const itemDate = new Date(item.time).toDateString();
            return itemDate === today;
        });

        if (todayHistory.length === 0) {
            historyList.innerHTML = '<p class="no-history">No reminders yet today</p>';
            return;
        }

        historyList.innerHTML = todayHistory.map(item => {
            const statusText = item.status === 'completed' ? '✓ Completed' :
                             item.status === 'snoozed' ? '⏰ Snoozed' : '⏳ Pending';
            const statusClass = item.status;
            
            return `
                <div class="history-item ${statusClass}">
                    <span class="history-time">${item.timeString}</span>
                    <span class="history-status">${statusText}</span>
                </div>
            `;
        }).join('');
    }

    clearHistory() {
        if (confirm('Clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
        }
    }

    loadHistory() {
        const saved = localStorage.getItem('eyeDropsHistory');
        return saved ? JSON.parse(saved) : [];
    }

    saveHistory() {
        localStorage.setItem('eyeDropsHistory', JSON.stringify(this.history));
    }

    saveState() {
        localStorage.setItem('eyeDropsActive', this.isActive);
        if (this.nextReminderTime) {
            localStorage.setItem('nextReminderTime', this.nextReminderTime.toISOString());
        } else {
            localStorage.removeItem('nextReminderTime');
        }
    }

    updateUI() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = statusIndicator.querySelector('.status-text');
        const nextReminderDiv = document.getElementById('nextReminder');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (this.isActive) {
            statusIndicator.classList.add('active');
            statusText.textContent = 'Active';
            startBtn.disabled = true;
            stopBtn.disabled = false;

            if (this.nextReminderTime) {
                const timeString = this.nextReminderTime.toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric'
                });
                nextReminderDiv.innerHTML = `<p><strong>Next reminder:</strong> ${timeString}</p>`;
            }
        } else {
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Inactive';
            startBtn.disabled = false;
            stopBtn.disabled = true;
            nextReminderDiv.innerHTML = '<p>Start reminders to see next alert</p>';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.reminderApp = new EyeDropsReminder();
});

// Restore state on page load
window.addEventListener('load', () => {
    const wasActive = localStorage.getItem('eyeDropsActive') === 'true';
    const savedNextReminder = localStorage.getItem('nextReminderTime');
    
    if (wasActive && savedNextReminder) {
        const nextTime = new Date(savedNextReminder);
        if (nextTime > new Date()) {
            // Auto-start if was active and next reminder is in future
            setTimeout(() => {
                if (window.reminderApp) {
                    window.reminderApp.nextReminderTime = nextTime;
                    window.reminderApp.start();
                }
            }, 100);
        }
    }
});
