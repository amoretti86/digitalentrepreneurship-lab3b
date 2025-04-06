// routes/uploadInsurance.js
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'tmp/' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /upload-insurance
router.post('/', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
]), async (req, res) => {
  const { email } = req.body;
  if (!email || !req.files) {
    return res.status(400).json({ message: 'Missing email or files' });
  }

  const uploadFile = async (file, label) => {
    const filePath = path.resolve(file.path);
    const fileExt = path.extname(file.originalname);
    const fileName = `${email}/${label}${fileExt}`;

    const { error } = await supabase.storage
      .from('insurance-cards')
      .upload(fileName, fs.createReadStream(filePath), {
        contentType: file.mimetype,
        upsert: true,
      });

    fs.unlinkSync(filePath); // clean up temp file
    if (error) throw error;
    return fileName;
  };

  try {
    const result = {};
    if (req.files.front) {
      result.front = await uploadFile(req.files.front[0], 'front');
    }
    if (req.files.back) {
      result.back = await uploadFile(req.files.back[0], 'back');
    }
    res.status(200).json({ message: 'Upload successful', files: result });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
