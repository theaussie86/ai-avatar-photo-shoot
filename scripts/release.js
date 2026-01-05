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
  execSync(`npm version ${releaseType}`, { stdio: 'inherit' });

  // 2. Get new version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = `v${packageJson.version}`;
  console.log(`New version: ${newVersion}`);

  // 3. Generate release notes (commits since last tag)
  // We use the previous tag. Since we just tagged, the "previous" one is the one before this.
  // Actually, npm version creates a tag. 
  // Let's get the commits between the *previous* tag and HEAD.
  // But wait, npm version made a commit and a tag.
  // So we want the commits from the tag BEFORE this new one, up to this new one.
  
  const tags = execSync('git tag --sort=-v:refname').toString().trim().split('\n');
  const currentTag = tags[0]; // The one we just made
  const previousTag = tags[1];

  let logRange = '';
  if (previousTag) {
    logRange = `${previousTag}..${currentTag}`;
  } else {
    logRange = currentTag; // First release
  }

  console.log(`Generating release notes for range: ${logRange}`);
  const releaseNotes = execSync(`git log ${logRange} --pretty=format:"- %s (%h)"`).toString();

  console.log('Release Notes:\n', releaseNotes);

  // 4. Push changes and tags
  console.log('Pushing to GitHub...');
  execSync('git push --follow-tags', { stdio: 'inherit' });

  // 5. Create GitHub Release
  console.log('Creating GitHub Release...');
  // Escape quotes in notes for the command line
  const escapedNotes = releaseNotes.replace(/"/g, '\\"');
  execSync(`gh release create ${newVersion} --title "${newVersion}" --notes "${escapedNotes}"`, { stdio: 'inherit' });

  console.log(`Successfully released ${newVersion}!`);
} catch (error) {
  console.error('Release failed:', error.message);
  process.exit(1);
}
