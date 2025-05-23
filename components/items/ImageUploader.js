import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path as needed

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * ImageUploader component for selecting, previewing, and uploading images for an item.
 * @param {object} props - Component props.
 * @param {string} props.itemId - The ID of the item to associate images with.
 * @param {string} props.sessionToken - The user's session token for authenticated requests.
 */
function ImageUploader({ itemId, sessionToken }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { [fileName]: progress }
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemImages, setItemImages] = useState([]);

  const fetchItemImages = useCallback(async () => {
    if (!itemId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('itemId', itemId)
        .order('uploadedAt', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setItemImages(data || []);
    } catch (err) {
      console.error('Error fetching item images:', err);
      setError('Failed to load existing images.');
    }
  }, [itemId]);

  useEffect(() => {
    fetchItemImages();
  }, [fetchItemImages]);

  const handleFileSelect = (event) => {
    setError('');
    setSuccessMessage('');
    const files = Array.from(event.target.files);
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File ${file.name} is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(`File ${file.name} has an invalid type. Allowed types: JPEG, PNG, WEBP.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected to upload.');
      return;
    }
    if (!sessionToken) {
        setError('Authentication token is missing. Please log in.');
        return;
    }

    setUploading(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress({});

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('imageFile', file);
      formData.append('itemId', itemId);

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/items/images/upload', true);
        xhr.setRequestHeader('Authorization', `Bearer ${sessionToken}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [file.name]: percentComplete }));
          }
        };

        xhr.onload = () => {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          if (xhr.status >= 200 && xhr.status < 300) {
            const newImage = JSON.parse(xhr.responseText);
            setItemImages(prevImages => [newImage, ...prevImages]); // Add to start of list
            setSuccessMessage(prev => prev ? `${prev}, ${file.name} uploaded.` : `${file.name} uploaded.`);
          } else {
            const responseError = JSON.parse(xhr.responseText);
            setError(prev => prev ? `${prev}, Upload failed for ${file.name}: ${responseError.message || xhr.statusText}` : `Upload failed for ${file.name}: ${responseError.message || xhr.statusText}`);
          }
        };

        xhr.onerror = () => {
          setError(prev => prev ? `${prev}, Network error during upload of ${file.name}.` : `Network error during upload of ${file.name}.`);
          setUploadProgress(prev => ({ ...prev, [file.name]: 'Error' }));
        };
        
        xhr.send(formData);

      } catch (err) {
        console.error('Upload error for file:', file.name, err);
        setError(prev => prev ? `${prev}, Upload failed for ${file.name}: ${err.message}` : `Upload failed for ${file.name}: ${err.message}`);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'Error' }));
      }
    }
    // Clear selected files after attempting upload for all
    setSelectedFiles([]);
    setPreviews([]); 
    // Keep uploading true until all XHR requests are complete (this is a simplification)
    // A more robust solution would track completion of all XHRs.
    // For now, we'll set it to false after the loop.
    // A small timeout to allow final progress updates.
    setTimeout(() => setUploading(false), selectedFiles.length * 100); 
  };

  const removePreview = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPrev = prev.filter((_, i) => i !== index);
      // Revoke object URL to free memory
      URL.revokeObjectURL(previews[index]);
      return newPrev;
    });
  };

  return (
    <div className="my-4 p-4 border rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3">Upload Images</h3>
      
      {error && <p className="text-red-500 bg-red-100 p-2 rounded mb-2">{error}</p>}
      {successMessage && <p className="text-green-500 bg-green-100 p-2 rounded mb-2">{successMessage}</p>}

      <div className="mb-4">
        <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-1">
          Select images (Max 5MB each, JPEG/PNG/WEBP)
        </label>
        <input
          id="imageUpload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading}
        />
      </div>

      {previews.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2">Selected Files:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((previewUrl, index) => (
              <div key={index} className="relative group">
                <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-md shadow" />
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                  aria-label="Remove image"
                >
                  X
                </button>
                {uploadProgress[selectedFiles[index]?.name] !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-700 bg-opacity-50 text-white text-xs p-1 text-center">
                    {typeof uploadProgress[selectedFiles[index]?.name] === 'number' 
                      ? `${uploadProgress[selectedFiles[index]?.name]}%` 
                      : uploadProgress[selectedFiles[index]?.name]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>
      )}

      <div className="mt-6">
        <h4 className="text-lg font-semibold mb-2">Uploaded Images:</h4>
        {itemImages.length === 0 && !uploading && <p className="text-gray-500">No images uploaded for this item yet.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {itemImages.map(image => (
            <div key={image.imageId} className="border rounded-md overflow-hidden shadow">
              <img 
                src={image.storageUrl} 
                alt={`Item image ${image.imageId}`} 
                className="w-full h-40 object-cover" 
              />
              <div className="p-2 text-xs">
                <p className="truncate" title={image.metadata?.originalName}>{image.metadata?.originalName || 'Image'}</p>
                {image.isPrimary && <span className="text-green-600 font-semibold">(Primary)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageUploader;