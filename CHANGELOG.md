# Changelog

## Version 1.0.1

### Added
- **Site Handler Architecture**: Created modular architecture allowing websites to implement their own specific pausing and seeking behaviors
- **YouTube Handler**: Implemented dedicated handler for YouTube video controls
- **Documentation**: Added comprehensive README for site handlers to facilitate easy creation of new handlers in the future

### Fixed
- **Video Detector Bug**: Fixed issue where seeking to a new paused frame from an already paused state didn't properly trigger pause detection

### Changed
- **Netflix Handler**: Netflix functionality remains unchanged but is identified for future refactoring to use the new handler architecture
