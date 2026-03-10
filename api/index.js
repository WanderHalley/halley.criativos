require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/backup', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('barberslot_backups')
      .select('*')
      .eq('id', 'main_backup')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ success: true, data: data ? data.data : null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('barberslot_backups')
      .upsert({ 
        id: 'main_backup', 
        data: req.body, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, message: 'Backup salvo!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'online', service: 'BarberSlot API' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.listen(PORT, () => console.log('API rodando na porta ' + PORT));
