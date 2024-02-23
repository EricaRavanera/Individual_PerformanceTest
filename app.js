// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');

// Create an Express application
const app = express();
// Define the port to run the server
const PORT = process.env.PORT || 1126;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Connect to MongoDB using mongoose
mongoose.connect('mongodb://localhost:27017/mongo-test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  insertCourses(); // Call function to insert courses after successful connection
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Define the schema for a course
const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  tags: {
    type: [String],
    required: true
  }
});

// Define the Course model based on the schema
const Course = mongoose.model('Course', courseSchema);

// Read and process curriculum data from a JSON file
let courses = [];
try {
  const curriculumData = JSON.parse(fs.readFileSync('courses.json', 'utf8'));
  courses = curriculumData.flatMap(year => Object.values(year)).flatMap(course => course);
} catch (error) {
  console.error('Error reading curriculum data:', error);
}

// Function to insert courses into the MongoDB database
async function insertCourses() {
  try {
    await Course.deleteMany({}); // Clear existing data before inserting
    await Course.insertMany(courses);
    console.log('Courses inserted successfully');
  } catch (error) {
    console.error('Error inserting courses:', error);
  }
}

// Retrieve all published backend courses and sort them alphabetically by their names.
app.get('/backend-courses', async (req, res) => {
  try {
    const backendCourses = await Course.find({ tags: { $in: ['Programming', 'Database Management', 'Web Development'] } })
      .select('description tags')
      .sort({ description: 1 });

    res.json(backendCourses);
  } catch (error) {
    console.error('Error retrieving backend courses:', error);
    res.status(500).json({ error: 'Error retrieving backend courses' });
  }
});

// Retrieve published BSIS and BSIT courses
app.get('/bsis-bsit-courses', async (req, res) => {
  try {
    const bsisBsitCourses = await Course.find({ tags: { $in: ['BSIS', 'BSIT'] } })
      .select('description tags');

    res.json(bsisBsitCourses);
  } catch (error) {
    console.error('Error retrieving BSIS/BSIT courses:', error);
    res.status(500).json({ error: 'Error retrieving BSIS/BSIT courses' });
  }
});

// Start the server
let server;
try {
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error('Error starting server:', error);
}

// Close the server and MongoDB connection properly when SIGINT signal is received
process.on('SIGINT', async () => {
  console.log('Closing server...');
  try {
    await server.close();
    await mongoose.disconnect();
    console.log('Server closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing server:', err);
    process.exit(1);
  }
});
