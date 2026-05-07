# MCDS Mobile

MCDS Mobile is a custom React Native mobile application designed for students of Miami Country Day School. It serves as a user-friendly, native wrapper and companion app for the school's online portal (`myschoolapp.com`), offering a streamlined interface for everyday school tasks.

## Features

- **Automated Login:** Uses a hidden WebView to manage sessions and inject auto-login scripts, providing a seamless login experience without entering credentials every time.
- **Assignments Center:** View current, upcoming, and past assignments.
- **Schedule:** Access daily class schedules, including times, teachers, and room locations.
- **Grades & GPA:** View current grades and calculate GPA on the fly.
- **Messages:** Read and send messages through the portal's messaging system with a custom UI. Unread message notifications are built right in.
- **Customization:** Users can set custom background images and adjust blur effects to personalize their experience.
- **Resources:** Easy access to school announcements and quick links.
- **Clicker Game:** A fun built-in mini-game for downtime.
- **Preview Mode:** A built-in mode to test the UI with mock data without needing real credentials.

## Tech Stack

- **Framework:** React Native with Expo
- **Session/API Management:** React Native WebView (Used to proxy requests and handle CSRF tokens seamlessly with the school's Blackbaud/myschoolapp backend)
- **Database/Storage:** Firebase (via `firebaseConfig.js`) and AsyncStorage for local preferences.
- **UI Components:** React Native Paper, React Native SVG, and custom styling.

## How It Works

The app bypasses the limitations of traditional API integrations by utilizing a **persistent hidden WebView**. 
1. The user logs in through the WebView interface (which is presented to the user during authentication).
2. Once authenticated, the WebView is hidden.
3. The app communicates with the WebView using injected JavaScript (`fetchApiInWebView`, `postApiInWebView`) to make requests directly to the portal's internal APIs (e.g., `/api/webapp/context`, `/api/assignment2/...`).
4. Data is passed back to React Native via `window.ReactNativeWebView.postMessage` and rendered in the native UI.
