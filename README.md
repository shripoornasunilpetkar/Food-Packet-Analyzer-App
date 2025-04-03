# Food App

A web application that helps users identify and get information about food items through image scanning and analysis.

## Features

- Image scanning and recognition
- Food item identification
- Detailed food information display
- User-friendly interface
- Responsive design

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Modern web APIs

### Backend
- Node.js
- Express.js
- Tesseract.js (OCR)
- Google Cloud Vision API

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Google Cloud Vision API key

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd foodapp
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Add your Google Cloud Vision API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   PORT=3000
   ```

## Running the Application

1. Start the backend server:
```bash
cd backend
node server.js
```

2. Open the frontend:
   - Navigate to the `frontend` directory
   - Open `index.html` in your web browser
   - Or use a local development server

## Project Structure

```
foodapp/
├── frontend/           # Frontend code
│   ├── index.html     # Main entry point
│   ├── scan.html      # Scanning interface
│   ├── results.html   # Results display
│   ├── style.css      # Styles
│   └── *.js           # Frontend scripts
├── backend/           # Backend code
│   ├── server.js      # Main server file
│   └── uploads/       # Temporary file storage
├── .env.example       # Environment variables template
└── package.json       # Project dependencies
```

## Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- Use the provided `.env.example` as a template for setting up your environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository. 