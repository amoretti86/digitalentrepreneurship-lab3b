import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InsuranceUpload({ email }) {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [message, setMessage] = useState('');
  const [frontUrl, setFrontUrl] = useState(null);
  const [backUrl, setBackUrl] = useState(null);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const resFront = await axios.get(
          `/storage/v1/object/public/insurance-cards/${email}/front.jpg`
        );
        if (resFront.status === 200) setFrontUrl(resFront.request.responseURL);
      } catch {}
      try {
        const resBack = await axios.get(
          `/storage/v1/object/public/insurance-cards/${email}/back.jpg`
        );
        if (resBack.status === 200) setBackUrl(resBack.request.responseURL);
      } catch {}
    };
    fetchExisting();
  }, [email]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || (!frontFile && !backFile)) {
      setMessage('Please provide an email and at least one image.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    if (frontFile) formData.append('front', frontFile);
    if (backFile) formData.append('back', backFile);

    try {
      const res = await axios.post('/upload-insurance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Upload successful!');
      if (frontFile) setFrontUrl(URL.createObjectURL(frontFile));
      if (backFile) setBackUrl(URL.createObjectURL(backFile));
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Upload failed.');
    }
  };

  return (
    <div className="insurance-upload" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h3>Upload Insurance Card</h3>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Front of Card</label>
          <input type="file" accept="image/*" onChange={(e) => setFrontFile(e.target.files[0])} />
        </div>
        <div>
          <label>Back of Card</label>
          <input type="file" accept="image/*" onChange={(e) => setBackFile(e.target.files[0])} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Upload</button>
      </form>
      {message && <p>{message}</p>}

      {(frontUrl || backUrl) && <h4 style={{ marginTop: '1.5rem' }}>Previously Uploaded</h4>}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {frontUrl && (
          <div>
            <p>Front</p>
            <img src={frontUrl} alt="Front of card" style={{ width: '180px', borderRadius: '6px' }} />
          </div>
        )}
        {backUrl && (
          <div>
            <p>Back</p>
            <img src={backUrl} alt="Back of card" style={{ width: '180px', borderRadius: '6px' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default InsuranceUpload;
