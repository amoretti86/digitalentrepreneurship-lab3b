import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import AddressAutocomplete from './AddressAutocomplete';
import axios from 'axios';
import './PatientOnboarding.css';

const serviceOptions = [
  "Vaccinations (including travel shots)",
  "Custom Compounding Services",
  "CBD and THC Wellness Products",
  "Daily Medication Packs",
  "Medication Synchronization",
  "Support for Long-Term Care Facilities",
  "On-Demand Testing (e.g. strep, flu, HIV, hep C)",
  "Blood Pressure Monitoring",
  "Everyday Health Essentials",
  "Medical Supply Access",
  "Vitamins and Nutritional Support",
  "Medication Therapy Reviews",
  "Educational Resources"
].map(s => ({ value: s, label: s }));

const insuranceOptions = [
  "Aetna", "Anthem", "Amerigroup", "Ambetter", "Blue Cross Blue Shield",
  "Cigna", "EmblemHealth", "Fidelis Care", "Healthfirst", "Humana",
  "Kaiser Permanente", "Medicaid", "Medicare", "Molina Healthcare",
  "Oscar", "Tricare", "UnitedHealthcare", "WellCare", "Other",
  "Pay out of pocket / No insurance"
].map(p => ({ value: p, label: p }));

function PatientOnboarding({ email, onComplete }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [insurance, setInsurance] = useState(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!email) return;
    axios.get(`/onboard-patient?email=${encodeURIComponent(email)}`)
      .then((res) => {
        const { services, insurance, address } = res.data.data;
        setServices(services.map(s => ({ value: s, label: s })));
        setInsurance({ value: insurance, label: insurance });
        setAddress(address);
        setIsUpdating(true);
      })
      .catch(() => {
        // No existing data, proceed with blank onboarding
      });
  }, [email]);

  const handleSubmit = async () => {
    try {
      const payload = {
        email,
        services: services.map(s => s.value),
        insurance: insurance?.value || '',
        address,
      };
      const res = isUpdating
        ? await axios.put('/onboard-patient', payload)
        : await axios.post('/onboard-patient', payload);
      onComplete();
    } catch (err) {
      setError('There was a problem saving your information.');
    }
  };

  return (
    <div className="onboarding">
      <h2>Patient Onboarding</h2>

      {step === 1 && (
        <div className="step">
          <p>What services do you need help with?</p>
          <Select
            isMulti
            options={serviceOptions}
            value={services}
            onChange={setServices}
            placeholder="Select one or more services"
          />
          <button onClick={() => setStep(2)} disabled={services.length === 0}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="step">
          <label>Insurance Provider</label>
          <Select
            options={insuranceOptions}
            value={insurance}
            onChange={setInsurance}
            placeholder="Select your insurance plan"
          />
          <label style={{ marginTop: '1rem' }}>Address</label>
          <AddressAutocomplete onSelect={setAddress} />
          {address && <p className="confirmed">Selected Address: {address}</p>}
          <div className="nav-buttons">
            <button onClick={() => setStep(1)}>Back</button>
            <button onClick={() => setStep(3)} disabled={!insurance || !address}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h3>Review and Confirm</h3>
          <p><strong>Services:</strong> {services.map(s => s.label).join(', ')}</p>
          <p><strong>Insurance:</strong> {insurance?.label}</p>
          <p><strong>Address:</strong> {address}</p>
          <div className="nav-buttons">
            <button onClick={() => setStep(2)}>Back</button>
            <button onClick={handleSubmit}>{isUpdating ? 'Update' : 'Submit'}</button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default PatientOnboarding;