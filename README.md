# Draconic Chatroom (React + Vite + Appwrite)

This is a basic chatroom application built with React, Vite, and Appwrite for real-time messaging.

## Setup

1.  Ensure you have Node.js and npm installed.
2.  Set up your Appwrite backend (Project, Database, Collection, Attributes, Permissions).
    *   Create a Database (e.g., `database`).
    *   Create a Collection (e.g., `messages`) within the database.
    *   Add attributes to the `messages` collection: `text` (String, required). The owner of the message will be determined by document permissions.
    *   Enable Document Security on the `messages` collection.
    *   Set Collection Permissions for `messages`: `read("any")`, `create("users")`. Document-level permissions for update will be set when creating messages.
3.  Update `src/appwrite.js` with your Appwrite endpoint.
4.  Update `src/App.jsx` with your Database ID and Collection ID.
5.  Install dependencies: `npm install`
6.  Run the development server: `npm run dev`
