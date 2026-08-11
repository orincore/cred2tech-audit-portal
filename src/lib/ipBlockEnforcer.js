const net = require('node:net');
const { execFile } = require('node:child_process');
const path = require('node:path');

// Never let these be sent to the enforcement script, regardless of what
// net.isIP() thinks of them — blocking the loopback address or this box's
// own address would be a self-inflicted outage.
const FORBIDDEN_IPS = new Set(['127.0.0.1', '::1', '0.0.0.0']);

function isValidIp(ip) {
  return typeof ip === 'string' && net.isIP(ip) !== 0 && !FORBIDDEN_IPS.has(ip);
}

const SCRIPT_PATH = path.join(__dirname, '..', '..', 'scripts', 'apply-ip-block.sh');

function runScript(action, ip) {
  return new Promise((resolve, reject) => {
    // execFile (not exec) — args are passed as argv, never interpolated
    // into a shell string, so there's no injection surface here even
    // before the script's own re-validation runs.
    execFile(SCRIPT_PATH, [action, ip], { timeout: 15000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr?.trim() || err.message));
      else resolve(stdout.trim());
    });
  });
}

async function enforceBlock(ip) {
  if (!isValidIp(ip)) throw new Error('invalid IP address');
  return runScript('block', ip);
}

async function enforceUnblock(ip) {
  if (!isValidIp(ip)) throw new Error('invalid IP address');
  return runScript('unblock', ip);
}

module.exports = { isValidIp, enforceBlock, enforceUnblock };
