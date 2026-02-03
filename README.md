# 💧 Eye Drops Reminder Application

A complete web application that provides hourly reminders during daytime to help you remember to use your eye drops.

## Features

✅ **Customizable Schedule**
- Set your daytime hours (default: 8 AM - 8 PM)
- Adjustable reminder intervals (30 min, 1 hour, 2 hours)

✅ **Smart Notifications**
- Browser notifications with sound alerts
- In-app modal reminders
- Snooze functionality (5 minutes)

✅ **History Tracking**
- View today's reminder history
- Track completed and snoozed reminders
- Clear history option

✅ **Responsive Design**
- Works on desktop and mobile devices
- Beautiful gradient UI
- Smooth animations

✅ **Offline Support**
- Service worker for offline functionality
- Progressive Web App (PWA) ready

## How to Use

1. **Open the Application**
   - Open `index.html` in your web browser
   - Allow notifications when prompted

2. **Configure Settings**
   - Set your start time (when your day begins)
   - Set your end time (when your day ends)
   - Choose reminder interval

3. **Start Reminders**
   - Click "Start Reminders" button
   - The app will show your next reminder time
   - Keep the browser tab open for best results

4. **Handle Reminders**
   - When reminded, click "Done" to mark as completed
   - Or click "Snooze 5 min" to be reminded again shortly

5. **Test Functionality**
   - Use "Test Notification" button to preview reminders

## Technical Details

- **Pure JavaScript** - No frameworks required
- **LocalStorage** - Settings and history persist across sessions
- **Web Audio API** - For notification sounds
- **Notification API** - For browser notifications
- **Service Worker** - For offline support

## Browser Compatibility

Works best in modern browsers:
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

## Installation as PWA

1. Open the app in your browser
2. Look for "Install" prompt or menu option
3. Click "Install" to add to home screen
4. Access like a native app

## Files

- `index.html` - Main application structure
- `styles.css` - Beautiful styling and animations
- `app.js` - Core application logic
- `sw.js` - Service worker for offline support
- `manifest.json` - PWA configuration

## Privacy

All data is stored locally in your browser. No data is sent to any server.

---

**Take care of your eyes! 💚**
