# AI-Based Task Manager Web App - Nexus AI

Nexus AI is an AI-powered task management web application designed to help users organize their projects, tasks, and teams efficiently. It features a modern React frontend with real-time collaboration capabilities and a robust Node.js backend with MongoDB for data persistence.

## Features

- User authentication and authorization
- Project and task management
- Team collaboration
- Real-time updates with Socket.io
- Calendar integration
- Statistics and analytics with charts
- AI-powered chatbot for assistance
- Responsive design with TailwindCSS

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or cloud service like MongoDB Atlas) - [Download here](https://www.mongodb.com/)
- **Git** - [Download here](https://git-scm.com/)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/NEERAJKUMARYADAV2004/AI-Based-Task-Manager-Web-App-Nexus.git
   cd AI-Based-Task-Manager-Web-App-Nexus
   ```

2. **Backend Setup:**

   ```bash
   cd Backend
   npm install
   ```

   Create a `.env` file in the `Backend` directory with the following content:

   ```
   MONGO_URI=mongodb://localhost:27017/your_db_name_here
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

   **Note:** Replace `your_secret_key_here` with a strong secret key for JWT authentication. If using MongoDB Atlas, update the `MONGO_URI` accordingly.

3. **Frontend Setup:**

   ```bash
   cd ../"Nexus AI"
   npm install
   ```

## Running the Application

1. **Start MongoDB:**

   Make sure MongoDB is running on your system. If using local MongoDB:

   ```bash
   mongod
   ```

   Or start the MongoDB service if installed as a service.

2. **Start the Backend:**

   ```bash
   cd Backend
   npm start
   ```

   The backend server will start on `http://localhost:5000`.

3. **Start the Frontend:**

   Open a new terminal and run:

   ```bash
   cd "Nexus AI"
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`.

4. **Access the Application:**

   Open your web browser and navigate to `http://localhost:5173` to use the application.

## Project Structure

```
AI-Based-Task-Manager-Web-App-Nexus/
├── Backend/                 # Node.js Express backend
│   ├── middleware/          # Authentication middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── server.js            # Main server file
│   └── package.json
└── Nexus AI/                # React frontend
    ├── public/              # Static assets
    ├── src/
    │   ├── components/      # React components
    │   ├── data/            # Mock data
    │   └── utils/           # Utility functions
    ├── package.json
    └── vite.config.js
```

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **React Big Calendar** - Calendar component
- **Lucide React** - Icon library
- **Socket.io Client** - Real-time client

## API Endpoints

The backend provides RESTful API endpoints for:

- User authentication (`/api/auth`)
- User profiles (`/api/profile`)
- Projects (`/api/projects`)
- Tasks (`/api/tasks`)
- Teams (`/api/teams`)
- Notes (`/api/notes`)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please contact the project maintainer.
