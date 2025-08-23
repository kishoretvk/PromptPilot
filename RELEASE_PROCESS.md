# Release Process

This document describes the process for creating and publishing new releases of PromptPilot.

## Versioning Strategy

PromptPilot follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

## Release Cadence

- **Major releases**: As needed for breaking changes
- **Minor releases**: Monthly for new features
- **Patch releases**: As needed for bug fixes

## Release Process

### 1. Pre-Release Checklist

Before creating a release, ensure the following:

- [ ] All issues in the milestone are closed or moved to the next milestone
- [ ] All tests pass (unit, integration, and end-to-end)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated with changes
- [ ] Code coverage is maintained or improved
- [ ] Security scan has been performed
- [ ] Dependencies are up to date

### 2. Create Release Branch

```bash
# Create release branch
git checkout -b release/vX.Y.Z

# Update version in relevant files
# - package.json (frontend)
# - __init__.py (backend)
# - Dockerfile labels
```

### 3. Update Documentation

- [ ] Update version numbers in documentation
- [ ] Update installation instructions if needed
- [ ] Add release notes to CHANGELOG.md
- [ ] Update README.md if necessary

### 4. Final Testing

- [ ] Run full test suite
- [ ] Perform manual testing of key features
- [ ] Test Docker deployment
- [ ] Test production deployment guide

### 5. Create Git Tag

```bash
# Create annotated tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# Push tag to remote
git push origin vX.Y.Z
```

### 6. Create GitHub Release

1. Go to [GitHub Releases](https://github.com/kishoretvk/PromptPilot/releases)
2. Click "Draft a new release"
3. Select the tag you just created
4. Set release title to "vX.Y.Z"
5. Add release notes (copy from CHANGELOG.md)
6. Attach binaries if applicable
7. Publish release

### 7. Update Docker Hub

```bash
# Build and push Docker images
docker build -t promptpilot/promptpilot:vX.Y.Z .
docker push promptpilot/promptpilot:vX.Y.Z

# Update latest tag
docker tag promptpilot/promptpilot:vX.Y.Z promptpilot/promptpilot:latest
docker push promptpilot/promptpilot:latest
```

### 8. Update Package Registries

- [ ] Publish to PyPI (for backend)
- [ ] Publish to npm (for frontend components, if applicable)

### 9. Announce Release

- [ ] Post on social media
- [ ] Send announcement to mailing list
- [ ] Update website
- [ ] Notify community channels

### 10. Post-Release Tasks

- [ ] Create new milestone for next release
- [ ] Update project roadmap
- [ ] Close completed milestone
- [ ] Update development version to next snapshot

## Emergency Releases

For critical security fixes or major bugs:

1. Create hotfix branch from latest release tag
2. Apply minimal changes to fix the issue
3. Follow abbreviated release process
4. Release as patch version

## Release Notes Template

```markdown
# PromptPilot vX.Y.Z

[Summary of release]

## 🚀 New Features

- Feature 1
- Feature 2

## 🐛 Bug Fixes

- Fix 1
- Fix 2

## 🔧 Improvements

- Improvement 1
- Improvement 2

## 🔒 Security

- Security fix 1
- Security fix 2

## 📚 Documentation

- Documentation update 1
- Documentation update 2

## ⬆️ Upgrading

[Instructions for upgrading from previous version]

## 📦 Download

[Links to download/installation instructions]
```

## Roles and Responsibilities

- **Release Manager**: Oversees the release process
- **Quality Assurance**: Ensures release quality
- **Documentation Lead**: Maintains documentation
- **Community Manager**: Handles announcements