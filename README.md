# Procruit - Recruitment Platform

A comprehensive recruitment platform for Candidates, Recruiters, and Freelance Interviewers.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, MongoDB (Atlas)
- **Database**: MongoDB

## Prerequisites
- Node.js installed

## Quick Start (Run Completely from Terminal)

1.  **Install Root Dependencies (Frontend)**
    ```bash
    npm install
    ```

2.  **Install Server Dependencies (Backend)**
    ```bash
    cd server
    npm install
    cd ..
    ```

3.  **Run the Application**
    From the root directory, run:
    ```bash
    npm run dev
    ```
    This command starts both the Frontend (Vite) and Backend (Express) concurrently.

4.  **Access the App**
    -   Frontend: [http://localhost:5173](http://localhost:5173)
    -   Backend API: [http://localhost:5001](http://localhost:5001)

## Environment Variables
The backend comes pre-configured with a MongoDB Atlas connection string in `server/.env`. No local database setup is required.
