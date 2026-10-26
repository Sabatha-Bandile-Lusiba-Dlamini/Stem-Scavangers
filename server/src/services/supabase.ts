import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadAudio(
  file: Express.Multer.File,
  folder: 'beats' | 'stems'
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

  const { error } = await supabase.storage
    .from('Stem Scavanger Audio')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('Stem Scavanger Audio')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteAudio(url: string): Promise<void> {
  // Extract path from full URL
  const path = url.split('/Stem Scavanger Audio/')[1];
  if (!path) return;

  await supabase.storage.from('Stem Scavanger Audio').remove([path]);
}
