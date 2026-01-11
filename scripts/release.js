const { execSync } = require('child_process');
const fs = require('fs');

const releaseType = process.argv[2];

if (!['major', 'minor', 'patch'].includes(releaseType)) {
  console.error('Usage: node scripts/release.js <major|minor|patch>');
  process.exit(1);
}

try {
  // 1. Bump version
  console.log(`Bumping version (${releaseType})...`);
  // --no-git-tag-version prevents npm from creating a git tag and commit automatically,
  // allowing us to control the commit message and staging.
  // Actually, we WANT a commit, just not a tag.
  // npm version <type> by default creates a tag.
  // We want to update files, maybe commit, but NO TAG.
  execSync(`npm version ${releaseType} --no-git-tag-version`, { stdio: 'inherit' });

  // 2. Get new version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = `v${packageJson.version}`;
  console.log(`New version: ${newVersion}`);

  // 3. Stage and Commit
  console.log('Staging and committing changes...');
  execSync('git add package.json package-lock.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): ${newVersion}"`, { stdio: 'inherit' });

  console.log('\n---------------------------------------------------------');
  console.log(`Successfully bumped to ${newVersion} and created commit.`);
  console.log('Now, please push your branch and open a Pull Request:');
  console.log(`  git push origin <your-branch-name>`);
  console.log('---------------------------------------------------------');

} catch (error) {
  console.error('Release preparation failed:', error.message);
  process.exit(1);
}
