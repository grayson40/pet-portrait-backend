# PetPortrait Backend

## Overview

PetPortrait is an Express-based backend for the PetPortrait mobile application, designed to help pet owners capture perfect photos of their pets. This backend interacts with a Supabase database to manage users, pets, photos, comments, likes, and attention sounds.

## Features

- User authentication (signup and signin)
- CRUD operations for pets and photos
- Commenting on photos
- Liking photos
- Managing attention sounds

## Technologies Used

- Node.js
- Express
- TypeScript
- Supabase

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Supabase account and project

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/grayson40/pet-portrait-backend.git
   cd pet-portrait-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Supabase credentials:

   ```plaintext
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

### Running the Application

1. **Build the TypeScript files**:

   ```bash
   npm run build
   ```

2. **Start the server**:

   ```bash
   npm start
   ```

3. **For development mode with hot reloading**:

   ```bash
   npm run dev
   ```

### Seeding the Database

To populate the database with sample data, run the following command:

```bash
npm run dev
```


### API Endpoints

- **User Routes**
  - `POST /api/users/signup`: Create a new user
  - `POST /api/users/signin`: Sign in an existing user
  - `GET /api/users/:id`: Get user profile by ID

- **Pet Routes**
  - `POST /api/pets`: Add a new pet
  - `GET /api/pets/:user_id`: Get all pets for a user
  - `PUT /api/pets/:id`: Update a pet
  - `DELETE /api/pets/:id`: Delete a pet

- **Photo Routes**
  - `POST /api/photos`: Add a new photo
  - `GET /api/photos/:user_id`: Get all photos for a user
  - `PUT /api/photos/:id`: Update a photo
  - `DELETE /api/photos/:id`: Delete a photo

- **Comment Routes**
  - `POST /api/comments`: Add a new comment
  - `GET /api/comments/:photo_id`: Get comments for a photo
  - `DELETE /api/comments/:id`: Delete a comment

- **Like Routes**
  - `POST /api/likes/:photo_id`: Like a photo
  - `GET /api/likes/:photo_id`: Get likes for a photo
  - `DELETE /api/likes/:photo_id/:user_id`: Remove a like

- **Sound Routes**
  - `GET /api/sounds`: Get all attention sounds
  - `POST /api/sounds`: Add a new attention sound
  - `DELETE /api/sounds/:id`: Delete an attention sound

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the [MIT License](LICENSE).