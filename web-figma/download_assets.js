import fs from 'fs';
import path from 'path';
import https from 'https';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const destDir = path.join(__dirname, 'public', 'tesseract');
const langDir = path.join(destDir, 'lang-data');

// Ensure directories exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
if (!fs.existsSync(langDir)) {
  fs.mkdirSync(langDir, { recursive: true });
}

const filesToDownload = [
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    dest: path.join(destDir, 'tesseract-worker.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js',
    dest: path.join(destDir, 'tesseract-core.wasm.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm',
    dest: path.join(destDir, 'tesseract-core.wasm')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js',
    dest: path.join(destDir, 'tesseract-core-simd.wasm.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm',
    dest: path.join(destDir, 'tesseract-core-simd.wasm')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js',
    dest: path.join(destDir, 'tesseract-core-lstm.wasm.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm',
    dest: path.join(destDir, 'tesseract-core-lstm.wasm')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js',
    dest: path.join(destDir, 'tesseract-core-simd-lstm.wasm.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm',
    dest: path.join(destDir, 'tesseract-core-simd-lstm.wasm')
  },
  // Language files (using tessdata_fast from jsDelivr/GitHub)
  {
    url: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_fast/ind.traineddata.gz',
    dest: path.join(langDir, 'ind.traineddata.gz')
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_fast/eng.traineddata.gz',
    dest: path.join(langDir, 'eng.traineddata.gz')
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved to ${dest}`);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete temp file
      reject(err);
    });
  });
}

async function run() {
  for (const item of filesToDownload) {
    let retries = 3;
    while (retries > 0) {
      try {
        await downloadFile(item.url, item.dest);
        break;
      } catch (err) {
        console.error(`Error downloading ${item.url}: ${err.message}. Retries left: ${retries - 1}`);
        retries--;
        if (retries === 0) {
          console.error(`Failed to download ${item.url} after multiple attempts.`);
          process.exit(1);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // Decompress .gz language files to raw .traineddata files
  console.log('Decompressing language files...');
  const gzFiles = [
    path.join(langDir, 'ind.traineddata.gz'),
    path.join(langDir, 'eng.traineddata.gz')
  ];

  for (const gzFile of gzFiles) {
    if (fs.existsSync(gzFile)) {
      const destFile = gzFile.slice(0, -3); // Remove .gz extension
      console.log(`Decompressing ${gzFile} to ${destFile} ...`);
      try {
        const compressedData = fs.readFileSync(gzFile);
        const decompressedData = zlib.gunzipSync(compressedData);
        fs.writeFileSync(destFile, decompressedData);
        console.log(`Decompressed successfully. Removing ${gzFile} ...`);
        fs.unlinkSync(gzFile);
      } catch (err) {
        console.error(`Error decompressing ${gzFile}: ${err.message}`);
        process.exit(1);
      }
    }
  }

  console.log('All downloads and decompression completed successfully!');
}

run();
