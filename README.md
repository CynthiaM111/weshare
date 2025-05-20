# WeShare - Ride Sharing for Public Transportation

WeShare is a ride-sharing app designed to enhance public transportation systems by offering an accessible and efficient platform for both users and transportation agencies. The platform includes two main components:

1. **Mobile App**: For public users to book rides, view schedules, and track their rides.
2. **Agency Dashboard**: For transportation agencies to manage rides, monitor vehicles, and track real-time data.

## Features

### Mobile App (User-facing)
- **Ride Booking**: Users can search for available rides, book rides in advance, and track the ride's progress in real-time.
- **Ride Tracking**: Provides real-time tracking of rides and estimated arrival times.
- **User Profiles**: Users can create and manage profiles, view ride history, and set preferences.
  
### Agency Dashboard (Admin-facing)
- **Ride Management**: Agencies can manage ride schedules, add or remove routes, and view ride performance.
- **Real-Time Monitoring**: Agencies can track active rides and vehicles on a live map.
- **Data Analytics**: Provides insights into ride usage, customer behavior, and operational efficiency.

## Tech Stack
- **Frontend (Mobile App)**: React Native
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API for communication between the mobile app and the backend server

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Steps to Run Locally

1. **Clone the repository**
    ```bash
    git clone https://github.com/CynthiaM111/weshare.git
    cd weshare
    ```

2. **Install dependencies**
    For the backend:
    ```bash
    cd backend
    npm install
    ```

    For the mobile app:
    ```bash
    cd mobile
    npm install
    ```

3. **Configure environment variables**
    In the `backend` directory, create a `.env` file and set your MongoDB URI, JWT secret, and other necessary variables:
    ```bash
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

4. **Start the backend server**
    ```bash
    cd backend
    npm start
    ```

5. **Run the mobile app**
    Follow React Native's setup for running the app on a simulator/emulator or your device:
    ```bash
    cd mobile
    npx react-native run-android  # for Android
    npx react-native run-ios      # for iOS
    ```

## Usage

- **For Users**: Open the mobile app to search for available rides, book your trip, and track its progress.
- **For Agencies**: Use the agency dashboard to monitor real-time rides, manage routes, and analyze ride data.

## Contributing

We welcome contributions! Feel free to fork the repository, submit issues, and create pull requests.

### Steps to Contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Create a new pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements
- React Native for building the mobile app
- Node.js and Express.js for backend services
- MongoDB for database storage

