// Constants
const API_URL = 'http://localhost:3001'; // Your backend URL
const WEBSITE_URL = 'http://localhost:3000'; // Your frontend URL

// Store the current recommendation
let currentRecommendation = null;

// Check authentication status when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup opened, checking token...');
  const token = await chrome.storage.local.get('authToken');
  console.log('Token status:', token.authToken ? 'exists' : 'not found');
  
  if (token.authToken) {
    console.log('Token found, checking for recommendation...');
    // Check if we have a recent recommendation
    const recommendation = await chrome.storage.local.get('currentRecommendation');
    if (recommendation.currentRecommendation) {
      showRecommendation(recommendation.currentRecommendation);
    } else {
      showMeasurements();
    }
  } else {
    console.log('No token found, showing login section');
    showLoginSection();
  }
});

// Show login section
function showLoginSection() {
  console.log('Displaying login section');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('measurements-section').style.display = 'none';
  document.getElementById('recommendation-section').style.display = 'none';
}

// Show recommendation section
function showRecommendation(recommendation) {
  console.log('Displaying recommendation section');
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('measurements-section').style.display = 'none';
  document.getElementById('recommendation-section').style.display = 'block';
  
  // Update recommendation display
  document.getElementById('recommended-size').textContent = recommendation.size;
  document.getElementById('recommendation-confidence').textContent = 
    `Based on ${recommendation.comparedMeasurements} measurement${recommendation.comparedMeasurements > 1 ? 's' : ''}`;
  
  const accuracyText = recommendation.averageCost === 0 
    ? 'Perfect fit (0.0cm avg difference)'
    : `${recommendation.averageCost.toFixed(1)}cm average difference`;
  document.getElementById('recommendation-accuracy').textContent = accuracyText;
  
  currentRecommendation = recommendation;
}

// Show measurements section
async function showMeasurements() {
  console.log('Attempting to show measurements section');
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('recommendation-section').style.display = 'none';
  document.getElementById('measurements-section').style.display = 'block';
  await fetchAndDisplayMeasurements();
}

// Login button handler
document.getElementById('login-btn').addEventListener('click', () => {
  console.log('Login button clicked, opening website');
  chrome.tabs.create({ url: `${WEBSITE_URL}/login` });
});

// Fetch and display measurements
async function fetchAndDisplayMeasurements() {
  console.log('Fetching measurements...');
  const token = await chrome.storage.local.get('authToken');
  console.log('Token for fetch:', token.authToken ? 'exists' : 'not found');
  
  if (!token.authToken) {
    console.log('No token found during fetch, showing login');
    showLoginSection();
    return;
  }

  try {
    console.log('Making API request to:', `${API_URL}/api/measurements/get?garmentType=tshirt`);
    console.log('Using token:', token.authToken.substring(0, 10) + '...');
    
    const response = await fetch(`${API_URL}/api/measurements/get?garmentType=tshirt`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch measurements: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw measurements response:', JSON.stringify(data, null, 2));
    console.log('Measurements object:', data.measurements);
    console.log('Nested measurements:', data.measurements?.measurements);
    displayMeasurements(data);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    // Don't remove the token immediately on error
    // chrome.storage.local.remove('authToken');
    showLoginSection();
  }
}

// Display measurements in the popup
function displayMeasurements(data) {
  console.log('Displaying measurements data:', data);
  const measurementsList = document.getElementById('measurements-list');
  measurementsList.innerHTML = ''; // Clear existing content
  
  if (!data || !data.measurements || !data.measurements.measurements) {
    console.log('No measurements to display');
    measurementsList.innerHTML = '<p class="no-measurements">No measurements found</p>';
    return;
  }

  // Get the measurements object and unit
  const measurements = data.measurements.measurements;
  const unit = data.measurements.unit;

  // Create a more user-friendly display name mapping
  const displayNames = {
    chestPitToPit: 'Chest (Pit to Pit)',
    chestAround: 'Chest (Around)',
    shoulderToHem: 'Length (Shoulder to Hem)',
    waist: 'Waist',
    hip: 'Hip'
  };

  // Display the measurements
  for (const [key, value] of Object.entries(measurements)) {
    if (value) { // Only display measurements that have values
      const measurementItem = document.createElement('div');
      measurementItem.className = 'measurement-item';
      
      const label = document.createElement('span');
      label.className = 'measurement-label';
      label.textContent = displayNames[key] || key;
      
      const valueSpan = document.createElement('span');
      valueSpan.className = 'measurement-value';
      valueSpan.textContent = `${value} ${unit}`;
      
      measurementItem.appendChild(label);
      measurementItem.appendChild(valueSpan);
      measurementsList.appendChild(measurementItem);
    }
  }

  // If no measurements were displayed, show the no measurements message
  if (measurementsList.children.length === 0) {
    measurementsList.innerHTML = '<p class="no-measurements">No measurements found</p>';
  }
}

// Add logout functionality
document.getElementById('logout-btn').addEventListener('click', async () => {
  console.log('Logout clicked');
  await chrome.storage.local.remove(['authToken', 'currentRecommendation']);
  showLoginSection();
});

// Add adjust measurements button handler
document.getElementById('adjust-btn').addEventListener('click', () => {
  console.log('Adjust measurements clicked, opening profile page');
  chrome.tabs.create({ url: `${WEBSITE_URL}/profile` });
});

// Add adjust measurements button handler
document.getElementById('adjust-measurements-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${WEBSITE_URL}/profile` });
});

// View details button handler
document.getElementById('view-details-btn').addEventListener('click', () => {
  showMeasurements();
});

// Listen for recommendation updates from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SIZE_RECOMMENDATION') {
    console.log('Received size recommendation:', request.recommendation);
    
    // Store the recommendation
    chrome.storage.local.set({ 
      currentRecommendation: request.recommendation 
    });
    
    // Show the recommendation if popup is open
    showRecommendation(request.recommendation);
    
    sendResponse({ received: true });
  }
});

// Handle unit toggle and display logic here
// (Similar to your website implementation)

// Add back button
document.getElementById('back-btn').addEventListener('click', () => {
  if (currentRecommendation) {
    showRecommendation(currentRecommendation);
  }
});