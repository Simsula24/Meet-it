# App Overview

This is a cross-platform mobile app for iOS and Android that helps friends and groups organize and attend meetups together. The main functionality revolves around creating and managing meetups, inviting people, chatting, and sharing media—all in one place.

---

# Core Features

## ✅ Meetup Creation
- Users (organizers/hosts) can create a meetup by selecting:
  - A location (via map interface)
  - Date and time
  - Optional settings:
    - Max number of attendees
    - Duration of the meetup
    - Who can invite others (organizer only or all attendees)
    - Whether each attendee can bring a +1

## 📲 Invitation System
- Organizers can:
  - Invite users already registered in the app
  - Generate a one-time link to share with people who don’t have the app (they'll be prompted to install the app and join the meetup)

## 🖼️ Media Sharing
- Once a meetup is in progress or has ended, attendees can upload photos and videos
- Media is visible to all who joined the meetup

## 💬 Group Chat
- Each meetup has its own group chat for coordination
- Supports messages, notifications, and reactions

## 🔔 Notifications
Users receive notifications for:
- New messages in meetup chats
- New meetup invites
- Friend requests
- Changes to meetup details (time, location, etc.)
- Upcoming meetup reminders

## 👤 User Accounts
- Users register and verify their account using their **phone number**
- App can request access to contacts to:
  - Detect friends already using the app
  - Enable sending friend requests to those users

## 🧑🤝🧑 Friends System
- Users can send and accept friend requests
- View list of friends, friend profiles, and shared meetups

## ⚙️ Account Management
- Users can manage their profile:
  - Name
  - Profile picture
  - Friends list
  - Phone number

---

# Technical Notes

- Target Platforms: iOS and Android
- Real-time functionality (chat, live updates to meetup details, etc.)
- Cloud storage for media (photos/videos)
- Secure user authentication via phone number (e.g., OTP verification)
- Push notifications for engagement and updates
- Map interface for selecting meetup locations
- Privacy and security controls for each meetup (who can join/invite)

---

# Goal

Create a smooth and social meetup coordination experience for small groups, friends, and social circles—bridging both app users and non-users through shareable invite links.