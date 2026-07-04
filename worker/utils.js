// Web Crypto API utilities for Cloudflare Workers

// Generate a random client ID
export const generateClientId = () => {
  try {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    logEvent('generateClientId', error, 'error');
    return null;
  }
};

export const encryptMessage = async (message, key) => {
  let encrypted = '';

  try {
    const messageBuffer = new TextEncoder().encode(JSON.stringify(message));
    
    // Match server.js padding logic exactly
    const paddedLength = Math.ceil(messageBuffer.length / 16) * 16;
    const paddedBuffer = new Uint8Array(paddedLength);
    paddedBuffer.set(messageBuffer);

    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      paddedBuffer
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    
    encrypted = ivBase64 + '|' + encryptedBase64;

  } catch (error) {
    logEvent('encryptMessage', error, 'error');
  }

  return encrypted;
};

export const decryptMessage = async (message, key) => {
  let decrypted = {};

  try {
    const parts = message.split('|');
    const iv = new Uint8Array(atob(parts[0]).split('').map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(parts[1]).split('').map(c => c.charCodeAt(0)));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      encryptedData
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    decrypted = JSON.parse(decryptedText.replace(/\0+$/, ''));

  } catch (error) {
    logEvent('decryptMessage', error, 'error');
  }

  return decrypted;
};

export const logEvent = (source, message, level) => {
  if (
    level !== 'debug' ||
    true // config.debug would go here
  ) {

    const date = new Date(),
      dateString = date.getFullYear() + '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2) + ' ' +
      ('0' + date.getHours()).slice(-2) + ':' +
      ('0' + date.getMinutes()).slice(-2) + ':' +
      ('0' + date.getSeconds()).slice(-2);

    console.log('[' + dateString + ']', (level ? level.toUpperCase() : 'INFO'), source + (message ? ':' : ''), (message ? message : ''));

  }
};

export const getTime = () => {
  return (new Date().getTime());
};

export const isString = (value) => {
  return (
    value &&
    Object.prototype.toString.call(value) === '[object String]' ?
    true :
    false
  );
};

export const isArray = (value) => {
  return (
    value &&
    Object.prototype.toString.call(value) === '[object Array]' ?
    true :
    false
  );
};

export const isObject = (value) => {
  return (
    value &&
    Object.prototype.toString.call(value) === '[object Object]' ?
    true :
    false
  );
};

// Note: Since Cloudflare Workers don't have access to global.gc,
// we're not including the garbage collection interval that's in server.js
// setInterval(() => {
//   if (global.gc) {
//     global.gc();
//   }
// }, 30000);