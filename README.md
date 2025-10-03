# UEM Transport System Backend

A Node.js backend API for the UEM Transport System Management application.

## Features

- User authentication and authorization
- Transport fleet management
- Route and schedule management
- Contact and inquiry handling
- Dashboard analytics
- Rate limiting and security middleware

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt.js
- **Security:** Helmet, CORS, Rate Limiting
- **File Upload:** Multer
- **Validation:** express-validator

## Project Structure

```
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   ├── logger.js           # Request logging
│   └── rateLimiter.js      # Rate limiting
├── models/
│   ├── Bus.js              # Bus model
│   ├── Contact.js          # Contact model
│   ├── Route.js            # Route model
│   ├── Schedule.js         # Schedule model
│   ├── StaffContact.js     # Staff contact model
│   ├── User.js             # User model
│   └── index.js            # Model exports
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── contact.js          # Contact routes
│   ├── dashboard.js        # Dashboard routes
│   ├── fleet.js            # Fleet management routes
│   ├── inquiries.js        # Inquiry routes
│   └── schedule.js         # Schedule routes
├── scripts/
│   ├── addDemoUsers.js     # Demo user creation
│   ├── clearDatabase.js    # Database cleanup
│   ├── createUsers.js      # User creation utility
│   ├── seedDatabase.js     # Database seeding
│   └── testContact.js      # Contact testing
├── server.js               # Main server file
└── package.json            # Project dependencies
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MegaBOT07/uem-backend.git
cd uem-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Fleet Management
- `GET /api/fleet` - Get all buses
- `POST /api/fleet` - Add new bus
- `PUT /api/fleet/:id` - Update bus information
- `DELETE /api/fleet/:id` - Delete bus

### Routes & Schedules
- `GET /api/schedule` - Get all schedules
- `POST /api/schedule` - Create new schedule
- `PUT /api/schedule/:id` - Update schedule
- `DELETE /api/schedule/:id` - Delete schedule

### Contact & Inquiries
- `GET /api/contact` - Get all contacts
- `POST /api/contact` - Create new contact
- `GET /api/inquiries` - Get all inquiries
- `POST /api/inquiries` - Submit new inquiry

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run seed` - Seed the database with initial data

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | JWT signing secret | - |
| NODE_ENV | Environment mode | development |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License.