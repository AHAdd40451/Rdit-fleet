# Setting Up Expo Project ID for Push Notifications

To use push notifications, you need an Expo Project ID. Here are the steps to set it up:

## Option 1: Using EAS (Recommended for Production)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```

3. **Initialize EAS in your project**:
   ```bash
   eas init
   ```
   This will create an `eas.json` file and link your project to Expo.

4. **Get your Project ID**:
   - After running `eas init`, your project ID will be in `eas.json`
   - Or visit: https://expo.dev/accounts/[your-account]/projects/[your-project]
   - The Project ID looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

5. **Add to app.config.js**:
   ```javascript
   extra: {
     eas: {
       projectId: 'your-project-id-here',
     },
   },
   ```

   Or add to `.env` file:
   ```
   EXPO_PUBLIC_EAS_PROJECT_ID=your-project-id-here
   ```

## Option 2: Using Expo Account (Without EAS)

1. **Create a project on Expo**:
   - Visit: https://expo.dev
   - Create a new project or use an existing one
   - Get the Project ID from the project settings

2. **Add to app.config.js**:
   ```javascript
   extra: {
     eas: {
       projectId: 'your-project-id-here',
     },
   },
   ```

## Option 3: Development with Expo Go (Temporary)

For development with Expo Go, you can temporarily work without a projectId, but push notifications will be limited. The app will show a warning.

For production builds, you **must** have a projectId.

## Verification

After adding the projectId:

1. Restart your development server:
   ```bash
   npm start
   ```

2. Clear cache if needed:
   ```bash
   npm start -- --clear
   ```

3. Test push notifications on a physical device

## Troubleshooting

- **Error: "No projectId found"**: Make sure you've added the projectId to `app.config.js` in the `extra.eas.projectId` field
- **Push notifications not working**: Ensure you're testing on a physical device (not simulator)
- **Token generation fails**: Check that you have notification permissions granted

## Notes

- The projectId is required for standalone builds (iOS/Android apps)
- For Expo Go development, it's recommended but not always strictly required
- Each Expo account can have multiple projects, each with a unique projectId

