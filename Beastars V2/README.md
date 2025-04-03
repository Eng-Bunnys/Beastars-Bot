# Beastars Re-write for GBF Handler v5 and discord.js v14.18

# Key Improvements:
### Handler
- Now uses GBFv5 and discord.js v14.18, this new handler uses significantly less RAM and has many more features compared to GBFv3

### Images
- Now uses a class to handle all the actions, which ensures better error handling, easier maintenance, and allows for both interaction and message commands

### Drive 
- Added constants for a consistent file storage location
- Added proper error messages with context
- Added cleanup for temporary files
- Added checks for missing data
- Uses atomic file operations now
- MIME types now have type assertion

### Wiki
- Added input validation, min & max length
- Improved error handling, more descriptive error messages
- Added support for redirect responses (301/302)
- Better type safety
- Now defers the reply in case of longer search times
- More reliable with proper HTTP status code handling
