# Football Team

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/shuncalvins-projects/v0-football-team-dk)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/Op2XlYJ74E9)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/shuncalvins-projects/v0-football-team-dk](https://vercel.com/shuncalvins-projects/v0-football-team-dk)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/Op2XlYJ74E9](https://v0.dev/chat/projects/Op2XlYJ74E9)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## 🌟 Overview

This is a comprehensive, full-stack web application designed to help football teams manage their schedules, player availability, match statistics, and more. It provides a centralized dashboard for players and managers to stay organized and informed about all team-related activities.

The application is built with a modern tech stack, featuring a Next.js frontend and a Supabase backend, and is designed to be fully responsive and internationalized, with support for English, Simplified Chinese, and Traditional Chinese.

## ✨ Key Features

-   **Dashboard:** A central hub providing a quick overview of upcoming matches, team statistics, and pending invitations.
-   **Match Management:** Create, edit, and delete matches. Track match details, including opponent, location, date, scores, and video links.
-   **Player Roster & Stats:** View a complete list of all team members. Track key performance statistics like appearances, goals, and assists, with powerful filtering and sorting capabilities.
-   **Availability Tracking:** Players can mark their availability for upcoming matches and training sessions, providing a clear overview for team managers.
-   **User Profiles:** Each user has a personal profile where they can manage their information and change their password.
-   **Internationalization (i18n):** Full support for multiple languages, including English, Simplified Chinese, and Traditional Chinese (default).
-   **Responsive Design:** The application is optimized for a seamless experience on both desktop and mobile devices.
-   **Progressive Web App (PWA):** The application can be installed on mobile devices for a native-app-like experience.

## 🛠️ Tech Stack

-   **Frontend:**
    -   [Next.js](https://nextjs.org/) (React Framework)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind CSS](https://tailwindcss.com/) for styling
    -   [shadcn/ui](https://ui.shadcn.com/) for UI components
-   **Backend:**
    -   [Supabase](https://supabase.io/) (PostgreSQL database, authentication, and auto-generated APIs)
-   **Deployment:**
    -   Ready for deployment on platforms like Vercel or Netlify.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   pnpm (or your package manager of choice)
-   A Supabase account and project

### Installation

1.  **Clone the repo:**
    ```sh
    git clone [https://github.com/your_username/your_project_name.git](https://github.com/your_username/your_project_name.git)
    ```
2.  **Install dependencies:**
    ```sh
    pnpm install
    ```
3.  **Set up your Supabase environment variables:**
    -   Create a `.env.local` file in the root of your project.
    -   Add your Supabase project URL and anon key:
        ```
        NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
        ```
4.  **Run the database schema:**
    -   Navigate to the SQL Editor in your Supabase project.
    -   Copy the contents of `scripts/01-create-tables.sql` and run it to set up your database tables and policies.
5.  **Run the development server:**
    ```sh
    pnpm dev
    ```
    The application will be available at `http://localhost:3000`.

## 📂 Folder Structure

The project is organized with a clean and scalable folder structure:

-   **`/app`**: The core of the application, following the Next.js App Router structure. Each folder represents a route.
-   **`/components`**: Contains all the React components.
    -   **`/ui`**: For small, reusable UI primitives (e.g., Button, Card, Input).
-   **`/contexts`**: Holds React Context providers for managing global state (e.g., authentication, language).
-   **`/hooks`**: For custom React hooks (e.g., `use-mobile` for responsive design).
-   **`/lib`**: Contains utility functions and third-party library configurations (e.g., Supabase client, i18n translations).
-   **`/public`**: For static assets like images and the PWA manifest.
-   **`/scripts`**: Holds SQL scripts for setting up the database schema.
-   **`/types`**: Contains TypeScript type definitions.
