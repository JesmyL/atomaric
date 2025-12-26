import { exec } from 'child_process';

const otpi = process.argv.indexOf('--otp') + 1;

if (!otpi || !+process.argv[otpi]) throw 'pass --otp <code>';

export const deployTheCode = async () => {
  await execAsync('npm run build');

  // await execAsync('npm version major');
  // await execAsync('npm version minor');
  await execAsync('npm version patch');

  await execAsync(`npm publish --otp=${process.argv[otpi]}`);
};

const execAsync = stringCommand => {
  return new Promise((res, rej) =>
    exec(stringCommand, error => {
      if (error) rej(error);
      else res();
    }).on('message', message => console.info(message)),
  );
};

deployTheCode();
