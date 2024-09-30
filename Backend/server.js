const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary configuration
cloudinary.config({
  cloud_name: "dnryho2ce",
  api_key: "254116947211962",
  api_secret: "_uMByDjHSgEukuG5L3aWQlaa1B8",
});

// Routes
app.post('/api/process-video', async (req, res) => {
  try {
    const { videoUrl, images, duration } = req.body;
    console.log("Request from fronted :",  req.body);

    const overlays = images.map((image, index) => {
      const start_offset = (index + 1) * 10; // Starts at 10s, 20s, 30s...
      const end_offset = start_offset + 3;   // Ends at 13s, 23s, 33s...
      return {
        url: image, // Full image URL for the overlay
        start_offset,
        end_offset,
      };
    });

    const result = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      eager: [
        {
          transformation: overlays.map(overlay => ({
            overlay: {
              url: overlay.url, // Use the image URL directly in the overlay transformation
            },
            width: 400,
            crop: 'scale',
            gravity: 'south_west',
            x: 10,
            y: 10,
            start_offset: overlay.start_offset,
            end_offset: overlay.end_offset,
          })),
        },
      ],
    });

    res.status(200).json({ processedVideoUrl: result.eager[0].secure_url });
    console.log("Processed video:", result.eager[0].secure_url);
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Error processing video' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});