import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [selectedGarment, setSelectedGarment] = useState('tshirt');
  const [unit, setUnit] = useState('cm');
  const [displayMeasurements, setDisplayMeasurements] = useState({
    chestPitToPit: '',
    chestAround: '',
    shoulderToHem: '',
    waist: '',
    hip: ''
  });
  // Store actual measurements in cm
  const [measurements, setMeasurements] = useState({
    chestPitToPit: '',
    chestAround: '',
    shoulderToHem: '',
    waist: '',
    hip: ''
  });

  // Conversion functions
  const cmToInches = (cm) => (cm ? (parseFloat(cm) / 2.54).toFixed(2) : '');
  const inchesToCm = (inches) => (inches ? (parseFloat(inches) * 2.54).toFixed(2) : '');

  // Convert measurements based on selected unit - wrapped in useCallback
  const convertMeasurements = useCallback((meas, targetUnit) => {
    const converted = {};
    Object.keys(meas).forEach(key => {
      if (meas[key]) {
        converted[key] = targetUnit === 'inches' ? cmToInches(meas[key]) : meas[key];
      } else {
        converted[key] = '';
      }
    });
    return converted;
  }, []);

  // Handle unit change
  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    setDisplayMeasurements(convertMeasurements(measurements, newUnit));
  };

  // Handle measurement input changes
  const handleMeasurementChange = (field, value) => {
    const newDisplayMeasurements = {
      ...displayMeasurements,
      [field]: value
    };
    setDisplayMeasurements(newDisplayMeasurements);

    // Convert to cm for storage if needed
    const cmValue = unit === 'inches' ? inchesToCm(value) : value;
    setMeasurements(prev => ({
      ...prev,
      [field]: cmValue
    }));
  };

  // Add token verification and fetch measurements on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token and fetch measurements
    const verifyTokenAndFetchMeasurements = async () => {
      try {
        // Verify token
        const verifyRes = await fetch('http://localhost:3001/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!verifyRes.ok) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        // Fetch measurements
        const measurementsRes = await fetch(`http://localhost:3001/api/measurements/get?garmentType=${selectedGarment}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (measurementsRes.ok) {
          const data = await measurementsRes.json();
          if (data.measurements) {
            const cmMeasurements = data.measurements.measurements;
            setMeasurements(cmMeasurements);
            // Convert for display if needed
            setDisplayMeasurements(convertMeasurements(cmMeasurements, unit));
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    verifyTokenAndFetchMeasurements();
  }, [navigate, selectedGarment, unit, convertMeasurements]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/measurements/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          garmentType: selectedGarment,
          measurements, // This is already in cm
          unit: 'cm' // Always save as cm
        }),
      });
      
      if (response.ok) {
        alert('Measurements saved successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to save measurements');
      }
    } catch (error) {
      console.error('Error saving measurements:', error);
      alert('Error saving measurements');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header with Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Profile</h2>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Garment Selection and Unit Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={selectedGarment}
          onChange={(e) => setSelectedGarment(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        >
          <option value="tshirt">T-Shirt</option>
          <option value="trousers">Trousers</option>
          <option value="jacket">Jacket</option>
        </select>

        <div style={{ display: 'inline-block' }}>
          <label style={{ marginRight: '10px' }}>
            <input
              type="radio"
              value="cm"
              checked={unit === 'cm'}
              onChange={(e) => handleUnitChange(e.target.value)}
            /> cm
          </label>
          <label>
            <input
              type="radio"
              value="inches"
              checked={unit === 'inches'}
              onChange={(e) => handleUnitChange(e.target.value)}
            /> inches
          </label>
        </div>
      </div>

      {/* T-Shirt Measurements Form */}
      {selectedGarment === 'tshirt' && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Chest (Pit to Pit):
              <input
                type="number"
                step="0.1"
                value={displayMeasurements.chestPitToPit}
                onChange={(e) => handleMeasurementChange('chestPitToPit', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
              {unit}
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Chest Around:
              <input
                type="number"
                step="0.1"
                value={displayMeasurements.chestAround}
                onChange={(e) => handleMeasurementChange('chestAround', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
              {unit}
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Shoulder to Hem:
              <input
                type="number"
                step="0.1"
                value={displayMeasurements.shoulderToHem}
                onChange={(e) => handleMeasurementChange('shoulderToHem', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
              {unit}
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Waist:
              <input
                type="number"
                step="0.1"
                value={displayMeasurements.waist}
                onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
              {unit}
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Hip:
              <input
                type="number"
                step="0.1"
                value={displayMeasurements.hip}
                onChange={(e) => handleMeasurementChange('hip', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
              {unit}
            </label>
          </div>

          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#0077ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Measurements
          </button>
        </form>
      )}
    </div>
  );
}

export default Profile;