const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeReferral(value: string): string {
  let output = '';
  for (let index = 0; index < value.length; index += 3) {
    const first = value.charCodeAt(index);
    const second = index + 1 < value.length ? value.charCodeAt(index + 1) : 0;
    const third = index + 2 < value.length ? value.charCodeAt(index + 2) : 0;
    output += alphabet[first >> 2];
    output += alphabet[((first & 3) << 4) | (second >> 4)];
    output += index + 1 < value.length ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    output += index + 2 < value.length ? alphabet[third & 63] : '=';
  }
  return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeReferral(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  let output = '';
  for (let index = 0; index < normalized.length; index += 4) {
    const first = alphabet.indexOf(normalized[index]);
    const second = alphabet.indexOf(normalized[index + 1]);
    const third = alphabet.indexOf(normalized[index + 2]);
    const fourth = alphabet.indexOf(normalized[index + 3]);
    if (first < 0 || second < 0) throw new Error('Invalid invite link');
    output += String.fromCharCode((first << 2) | (second >> 4));
    if (normalized[index + 2] !== '=') output += String.fromCharCode(((second & 15) << 4) | (third >> 2));
    if (normalized[index + 3] !== '=') output += String.fromCharCode(((third & 3) << 6) | fourth);
  }
  return output;
}
