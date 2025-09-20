const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

async function uploadTestImage() {
  try {
    console.log('🔐 Note: For this test to work, you need to either:');
    console.log('1. Update Firebase Storage rules to allow unauthenticated uploads, OR');
    console.log('2. Create a test user and authenticate first');
    console.log('\nTrying unauthenticated upload first...');
    
    const imagePath = 'test-image.png';
    
    // Check if the test image exists
    if (!fs.existsSync(imagePath)) {
      throw new Error('Test image not found. Please run the image creation script first.');
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = `test-uploads/test-image-${Date.now()}.png`;
    
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, fileName);
    
    console.log(`Uploading image to: ${fileName}`);
    
    // Upload the file
    const uploadResult = await uploadBytes(storageRef, imageBuffer, {
      contentType: 'image/png'
    });
    
    console.log('Upload successful!');
    console.log('Upload result:', uploadResult);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);
    console.log('Firebase Console URL:', `https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/${firebaseConfig.storageBucket}/files/~2F${encodeURIComponent(fileName)}`);
    
    return { success: true, downloadURL, fileName };
    
  } catch (error) {
    console.error('Upload failed:', error.message);
    console.error('Error code:', error.code);
    return { success: false, error: error.message };
  }
}

// Run the upload
uploadTestImage().then(result => {
  if (result.success) {
    console.log('✅ Image uploaded successfully!');
    console.log('File:', result.fileName);
    console.log('URL:', result.downloadURL);
  } else {
    console.log('❌ Upload failed:', result.error);
  }
}).catch(error => {
  console.error('Script error:', error);
});