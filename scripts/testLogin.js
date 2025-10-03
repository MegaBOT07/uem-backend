import fetch from 'node-fetch'; // You might need to install: npm install node-fetch

const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@uem.edu.in',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('❌ Login failed:');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testLogin();