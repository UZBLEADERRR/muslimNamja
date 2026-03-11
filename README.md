# Muslim Namja - Food Delivery & Community App

Muslim Namja is a specialized food delivery and community platform built for the Muslim community in South Korea. The application integrates food ordering, real-time messaging, wallet-based payments, and a courier delivery system with Telegram bot notifications.

## 🚀 Tech Stack

- **Frontend:** React, Vite, Zustand (State Management), Socket.io-client, WebRTC (Simple-Peer), Lucide-React.
- **Backend:** Node.js, Express, Sequelize (PostgreSQL), Socket.io, Multer.
- **Integrations:** Telegram Bot API (for notifications), Google Gemini AI (for screenshot verification and address parsing).

## 🛠 Project Structure

- `/frontend`: React application containing the user interface, order flows, and community chat.
- `/backend`: Node.js server handling API requests, database logic, socket connections, and Telegram integration.

## 📖 Current Development Roadmap & Task List

The following items are currently pending implementation or fix. Any AI assistant or developer working on this repository should prioritize these tasks:

### 1. UI & UX Improvements
- **Food Detail Modal:** Currently, food details open in a modal that doesn't cover the full screen properly. It needs to be updated to a full-screen or centered window that avoids excessive scrolling.
- **Order Tracking Indicators:** In the tracking section, there should be a small notification or status indicator icon that visually shows the current progress of the order (e.g., Prepared, On the way).
- **Address Validation:** Users **must not** be able to place an order if their "Permanent Address" is empty. Add a prompt to fill this information before checkout.

### 2. Functional Fixes
- **Direct Messaging:** On a user's community profile, clicking the "Message" button should open a direct chat input. Currently, the chat input does not appear.
- **Courier Panel:** The courier dashboard should correctly list "Ready for pickup" orders. Currently, some prepared orders are not showing up for drivers.
- **Admin Management:** The core administrator should be able to change other admins' roles to "User" or "Courier". This logic is currently broken.

### 3. WebRTC & Multimedia
- **Calling Feature:** The WebRTC video/audio call feature is encountering permission errors. When camera/mic permissions are granted, the system still reports "Ruxsat yo'q" (Permission denied). This needs debugging.

### 4. AI-Enhanced Location Feature
- **Automatic Address Filling:** Implement a "Get Location" button. When clicked:
  1. The app captures the GPS coordinates.
  2. Google Gemini AI (or a similar service) parses the location data to determine the address.
  3. The "Permanent Address" field is automatically filled.
  4. Users should be able to add extra details manually (e.g., Floor number, Apartment number).

---

## 🤖 Note for AI Assistants
When assisting with this repository, please refer to the task list above. The user objectives are focused on refining the premium feel of the app, ensuring real-time reliability, and implementing the AI-driven location features.

## 📄 License
This project is private and intended for the Muslim Namja community.
