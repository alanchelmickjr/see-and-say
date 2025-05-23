import { supabase } from '../../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Disable Next.js body parsing, as formidable will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { 'authorization': authHeader } = req.headers;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];

  let user;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Auth error:', userError);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    user = userData.user;
  } catch (error) {
    console.error('Supabase auth getUser error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // 5MB
    keepExtensions: true,
  });

  try {
    const [fields, files] = await form.parse(req);

    const itemId = fields.itemId?.[0];
    const imageFileArray = files.imageFile;

    if (!itemId) {
      return res.status(400).json({ error: 'Missing itemId' });
    }

    if (!imageFileArray || imageFileArray.length === 0) {
      return res.status(400).json({ error: 'Missing imageFile' });
    }
    const imageFile = imageFileArray[0];


    if (!imageFile) {
        return res.status(400).json({ error: 'No image file uploaded or file key is incorrect.' });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(imageFile.mimetype)) {
      return res.status(400).json({ error: `Invalid file type: ${imageFile.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` });
    }

    // Validate file size (formidable already does this, but good for explicit check)
    if (imageFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: `File too large. Max size: ${MAX_FILE_SIZE_MB}MB` });
    }

    // Check if item exists and belongs to the user
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('item_id, user_id')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !itemData) {
      console.error('Item fetch error:', itemError);
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    // Generate unique file path for Supabase Storage
    const fileExtension = imageFile.originalFilename.split('.').pop();
    const uniqueFileName = `${user.id}/${itemId}/${uuidv4()}.${fileExtension}`;
    const storagePath = `item-images/${uniqueFileName}`;

    // Read file content
    const fileContent = fs.readFileSync(imageFile.filepath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('item-images') // Bucket name
      .upload(uniqueFileName, fileContent, {
        contentType: imageFile.mimetype,
        upsert: false, // Don't overwrite if file exists (should be unique anyway)
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to store image in cloud storage' });
    }
    
    // Construct public URL (or use path if preferred)
    // Note: Ensure your bucket 'item-images' has appropriate RLS for public access if needed,
    // or if you plan to serve images via signed URLs through another backend mechanism.
    // For simplicity, we'll assume public URLs are fine for now if the bucket is public.
    const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(uniqueFileName);
    const storageUrl = publicUrlData.publicUrl;


    // Check if this is the first image for the item to set as primary
    const { count: imageCount, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId);

    if (countError) {
      console.error('Error counting images:', countError);
      // Not fatal, proceed but log
    }
    const isPrimary = imageCount === 0;

    // Create image record in the database
    const newImageRecord = {
      item_id: itemId,
      user_id: user.id,
      storage_url: storageUrl, // Or `uploadData.path` if you prefer to store the path
      is_primary: isPrimary,
      metadata: {
        originalName: imageFile.originalFilename,
        size: imageFile.size,
        mimeType: imageFile.mimetype,
        storagePath: uploadData.path, // Store the actual path in metadata for reference
      },
    };

    const { data: dbImage, error: dbError } = await supabase
      .from('images')
      .insert(newImageRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Attempt to delete the uploaded file from storage if DB insert fails
      await supabase.storage.from('item-images').remove([uniqueFileName]);
      return res.status(500).json({ error: 'Failed to save image record to database' });
    }

    return res.status(201).json(dbImage);

  } catch (error) {
    console.error('Image upload processing error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `File too large. Max size: ${MAX_FILE_SIZE_MB}MB` });
    }
    return res.status(500).json({ error: 'Internal server error during image upload' });
  }
}