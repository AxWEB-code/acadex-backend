// Create src/testConnection.ts
import prisma from './prisma';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test raw query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Test if we can create a school
    const testSchool = await prisma.school.create({
      data: {
        name: "Test School",
        subdomain: "test-school-" + Date.now(),
        schoolCode: "SCH-TEST-1234",
        schoolType: "CBT",
      }
    });
    
    console.log('✅ School creation test passed:', testSchool);
    
    // Clean up test data
    await prisma.school.delete({
      where: { id: testSchool.id }
    });
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();