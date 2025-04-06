// In your server.js or routes/patient.js
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /onboard-patient (create)
router.post('/', async (req, res) => {
  const { email, services, insurance, address } = req.body;
  if (!email || !services || !insurance || !address) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const { data, error } = await supabase
    .from('patients')
    .insert([{ email, services, insurance, address }]);

  if (error) return res.status(500).json({ message: 'Supabase insert error.', error });
  return res.status(200).json({ message: 'Onboarding saved.', data });
});

// PUT /onboard-patient (update)
router.put('/', async (req, res) => {
  const { email, services, insurance, address } = req.body;
  if (!email || !services || !insurance || !address) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const { data, error } = await supabase
    .from('patients')
    .update({ services, insurance, address })
    .eq('email', email);

  if (error) return res.status(500).json({ message: 'Supabase update error.', error });
  return res.status(200).json({ message: 'Onboarding updated.', data });
});

// GET /onboard-patient?email=...
router.get('/', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: 'Email required.' });

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return res.status(404).json({ message: 'Onboarding not found.', error });
  return res.status(200).json({ data });
});

module.exports = router;
