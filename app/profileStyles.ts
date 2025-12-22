import { StyleSheet } from 'react-native';

const TEAL_GREEN = '#14AB98';
const BRIGHT_GREEN = '#B0E56D';
const profileStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    backButton: {
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: TEAL_GREEN,
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000',
    },
    placeholder: {
      width: 60,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: TEAL_GREEN,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 4,
    },
    profileRole: {
      fontSize: 16,
      color: '#666',
    },
    editButtonContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    editButton: {
      maxWidth: 200,
      alignSelf: 'center',
    },
    formSection: {
      paddingHorizontal: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#000',
      marginBottom: 8,
    },
    input: {
      marginBottom: 0,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 24,
      gap: 12,
      alignItems: 'stretch',
    },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: '#fff',
      minHeight: 50,
    },
    cancelButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonContainer: {
      flex: 1,
    },
    saveButton: {
      width: '100%',
      marginBottom: 0,
    },
    phoneInputWrapper: {
      width: '100%',
    },
    phoneInput: {
      width: '100%',
      height: 48,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
    },
    phoneInputTextContainer: {
      backgroundColor: '#fff',
      paddingVertical: 0,
    },
    phoneInputText: {
      fontSize: 16,
      color: '#000',
      paddingVertical: 0,
    },
    phoneInputCodeText: {
      fontSize: 16,
      color: '#000',
    },
  });

export default profileStyles;

