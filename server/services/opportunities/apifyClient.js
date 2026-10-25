import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

/**
 * Resilient HTTPS request helper to Apify API with retries and exponential backoff
 */
export async function makeApifyRequest(path, method = 'GET', body = null, retries = 3) {
  let attempt = 0;
  let delay = 1000;

  while (attempt < retries) {
    try {
      return await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.apify.com',
          path: `${path}${path.includes('?') ? '&' : '?'}token=${APIFY_API_TOKEN}`,
          method,
          headers: {
            'Accept': 'application/json'
          }
        };

        if (body) {
          options.headers['Content-Type'] = 'application/json';
        }

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed);
              } catch (e) {
                resolve(data);
              }
            } else {
              reject(new Error(`Apify API HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(60000, () => {
          req.destroy(new Error('Apify request timeout after 60s'));
        });

        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
      });
    } catch (err) {
      attempt++;
      if (attempt >= retries) {
        throw err;
      }
      console.warn(`Apify request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

/**
 * Checks Apify API Token Validity & User Info
 */
export async function checkApifyAccount() {
  const res = await makeApifyRequest('/v2/users/me');
  return res.data;
}
