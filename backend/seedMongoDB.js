const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const User = require('./models/User');
const Marks = require('./models/Marks');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Marks.deleteMany({});
    console.log('Cleared existing data');

    // Create teacher
    const teacher = await User.create({
      name: 'John Teacher',
      email: 'teacher@gradeflow.com',
      password: 'teacher123',
      role: 'teacher'
    });
    console.log('Teacher created:', teacher.name);

    // Create students
    const students = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@student.com',
        password: 'student123',
        role: 'student',
        studentId: 'STU2024001'
      },
      {
        name: 'Bob Smith',
        email: 'bob@student.com',
        password: 'student123',
        role: 'student',
        studentId: 'STU2024002'
      },
      {
        name: 'Carol Davis',
        email: 'carol@student.com',
        password: 'student123',
        role: 'student',
        studentId: 'STU2024003'
      }
    ]);
    console.log(`Created ${students.length} students`);

    // Create sample marks for each student
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
    const examTypes = ['Mid Term', 'Final Exam', 'Quiz', 'Assignment'];
    
    for (const student of students) {
      for (const subject of subjects) {
        for (const examType of examTypes) {
          // Generate random marks between 50-100
          const marks = Math.floor(Math.random() * 50) + 50;
          
          await Marks.create({
            studentId: student._id,
            studentName: student.name,
            subject: subject,
            marks: marks,
            examType: examType,
            teacherId: teacher._id,
            teacherName: teacher.name,
            remarks: `Sample ${examType} marks for ${subject}`
          });
        }
      }
      console.log(`Added marks for ${student.name}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Teacher: teacher@gradeflow.com / teacher123');
    console.log('Student: alice@student.com / student123');
    console.log('Student: bob@student.com / student123');
    console.log('Student: carol@student.com / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();